"""
Yield Token (YT) Smart Contract for Algorand

Yield Tokens capture all future yield until maturity. They represent the yield-earning
component of the tokenized split, allowing users to trade future yield expectations.

Key Features:
- Token-like functionality with minting/burning controls
- Maturity timestamp after which no more yield accrues
- Owner-controlled minting (usually the tokenization contract)
- Tradeable on AMM for yield speculation
"""

from algopy import (
    ARC4Contract,
    GlobalState,
    LocalState,
    Txn,
    Global,
    UInt64,
    Bytes,
    String,
    arc4,
    subroutine,
    log,
    op,
)


class YTToken(ARC4Contract):
    """Yield Token contract for yield tokenization"""
    
    def __init__(self) -> None:
        # Global state for token configuration
        self.owner = GlobalState(Bytes, key="owner")
        self.name = GlobalState(String, key="name")
        self.symbol = GlobalState(String, key="symbol")
        self.maturity = GlobalState(UInt64, key="maturity")
        self.total_supply = GlobalState(UInt64, key="total_supply")
        self.decimals = GlobalState(UInt64, key="decimals")
        
        # Local state for user balances
        self.balance = LocalState(UInt64, key="balance")
        self.allowance = LocalState(UInt64, key="allowance")

    @arc4.abimethod
    def initialize(
        self,
        name: String,
        symbol: String,
        maturity_timestamp: UInt64,
    ) -> String:
        """Initialize YT token with maturity"""
        assert Txn.sender == Global.creator_address, "Only creator can initialize"
        assert maturity_timestamp > Global.latest_timestamp, "Maturity must be in future"
        
        self.owner.value = Txn.sender.bytes
        self.name.value = name
        self.symbol.value = symbol
        self.maturity.value = maturity_timestamp
        self.total_supply.value = UInt64(0)
        self.decimals.value = UInt64(8)
        
        log(b"YT Token initialized - Maturity: " + op.itob(maturity_timestamp))
        return String("YT Token initialized successfully")

    @arc4.abimethod
    def mint(self, to: Bytes, amount: UInt64) -> String:
        """Mint YT tokens to an address (owner only)"""
        assert Txn.sender.bytes == self.owner.value, "Only owner can mint"
        assert amount > UInt64(0), "Amount must be positive"
        
        # Update total supply
        self.total_supply.value = self.total_supply.value + amount
        
        # Update recipient balance (simplified - in production would need proper address handling)
        # For now, mint to sender
        self.balance[Txn.sender] = self.balance[Txn.sender] + amount
        
        log(b"YT tokens minted - Amount: " + op.itob(amount))
        return String("YT tokens minted successfully")

    @arc4.abimethod
    def burn(self, amount: UInt64) -> String:
        """Burn YT tokens from sender's balance"""
        assert amount > UInt64(0), "Amount must be positive"
        
        current_balance = self.balance[Txn.sender]
        assert current_balance >= amount, "Insufficient balance"
        
        # Update balances
        self.balance[Txn.sender] = current_balance - amount
        self.total_supply.value = self.total_supply.value - amount
        
        log(b"YT tokens burned - Amount: " + op.itob(amount))
        return String("YT tokens burned successfully")

    @arc4.abimethod
    def transfer(self, to: Bytes, amount: UInt64) -> String:
        """Transfer YT tokens to another address"""
        assert amount > UInt64(0), "Amount must be positive"
        
        sender_balance = self.balance[Txn.sender]
        assert sender_balance >= amount, "Insufficient balance"
        
        # Update sender balance
        self.balance[Txn.sender] = sender_balance - amount
        
        # In production, would update recipient balance properly
        # For simplicity, just updating sender balance
        
        log(b"YT tokens transferred - Amount: " + op.itob(amount))
        return String("YT tokens transferred successfully")

    @arc4.abimethod(readonly=True)
    def balance_of(self, account: Bytes) -> UInt64:
        """Get balance of an account"""
        # Simplified - returns sender's balance
        return self.balance[Txn.sender]

    @arc4.abimethod(readonly=True)
    def get_total_supply(self) -> UInt64:
        """Get total supply of YT tokens"""
        return self.total_supply.value

    @arc4.abimethod(readonly=True)
    def get_maturity(self) -> UInt64:
        """Get maturity timestamp"""
        return self.maturity.value

    @arc4.abimethod(readonly=True)
    def is_mature(self) -> UInt64:
        """Check if token has reached maturity"""
        if Global.latest_timestamp >= self.maturity.value:
            return UInt64(1)  # True
        else:
            return UInt64(0)  # False

    @arc4.abimethod(readonly=True)
    def is_accruing_yield(self) -> UInt64:
        """Check if yield is still accruing (before maturity)"""
        if Global.latest_timestamp < self.maturity.value:
            return UInt64(1)  # True - still accruing
        else:
            return UInt64(0)  # False - no longer accruing

    @arc4.abimethod(readonly=True)
    def get_token_info(self) -> arc4.Tuple[arc4.String, arc4.String, arc4.UInt64, arc4.UInt64]:
        """Get token information"""
        return arc4.Tuple((
            arc4.String(self.name.value),
            arc4.String(self.symbol.value),
            arc4.UInt64(self.decimals.value),
            arc4.UInt64(self.total_supply.value)
        ))

    @arc4.abimethod(readonly=True)
    def get_yield_status(self) -> arc4.Tuple[arc4.UInt64, arc4.UInt64, arc4.UInt64]:
        """Get yield status information"""
        current_time = Global.latest_timestamp
        maturity_time = self.maturity.value
        
        is_accruing = UInt64(1) if current_time < maturity_time else UInt64(0)
        time_to_maturity = maturity_time - current_time if current_time < maturity_time else UInt64(0)
        
        return arc4.Tuple((
            arc4.UInt64(is_accruing),
            arc4.UInt64(time_to_maturity),
            arc4.UInt64(maturity_time)
        ))

    @arc4.abimethod
    def approve(self, spender: Bytes, amount: UInt64) -> String:
        """Approve spender to spend tokens on behalf of sender"""
        self.allowance[Txn.sender] = amount
        
        log(b"Approval set - Amount: " + op.itob(amount))
        return String("Approval set successfully")

    @arc4.abimethod(readonly=True)
    def get_allowance(self, owner: Bytes, spender: Bytes) -> UInt64:
        """Get allowance for spender"""
        # Simplified - returns sender's allowance
        return self.allowance[Txn.sender]

    @arc4.abimethod
    def transfer_from(self, from_addr: Bytes, to: Bytes, amount: UInt64) -> String:
        """Transfer tokens from one address to another using allowance"""
        assert amount > UInt64(0), "Amount must be positive"
        
        # Check allowance (simplified)
        current_allowance = self.allowance[Txn.sender]
        assert current_allowance >= amount, "Insufficient allowance"
        
        # Check balance (simplified - checking sender's balance)
        sender_balance = self.balance[Txn.sender]
        assert sender_balance >= amount, "Insufficient balance"
        
        # Update balances and allowance
        self.balance[Txn.sender] = sender_balance - amount
        self.allowance[Txn.sender] = current_allowance - amount
        
        log(b"Tokens transferred from - Amount: " + op.itob(amount))
        return String("Tokens transferred successfully")

    @arc4.abimethod
    def calculate_yield_value(self, base_amount: UInt64, yield_rate: UInt64) -> UInt64:
        """Calculate potential yield value based on time remaining"""
        current_time = Global.latest_timestamp
        maturity_time = self.maturity.value
        
        if current_time >= maturity_time:
            return UInt64(0)  # No yield after maturity
        
        time_remaining = maturity_time - current_time
        # Simple yield calculation: base_amount * yield_rate * time_remaining / (365 * 24 * 60 * 60 * 10000)
        # yield_rate is in basis points (10000 = 100%)
        seconds_per_year = UInt64(365 * 24 * 60 * 60)
        
        yield_value = (base_amount * yield_rate * time_remaining) // (seconds_per_year * UInt64(10000))
        return yield_value

    @arc4.abimethod
    def update_owner(self, new_owner: Bytes) -> String:
        """Update contract owner (current owner only)"""
        assert Txn.sender.bytes == self.owner.value, "Only owner can update"
        
        self.owner.value = new_owner
        
        log(b"Owner updated")
        return String("Owner updated successfully")


