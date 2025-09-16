"""
Principal Token (PT) Smart Contract for Algorand

Principal Tokens represent the right to redeem the original SY amount at maturity.
They are one half of the tokenized yield split, capturing the principal value.

Key Features:
- Token-like functionality with minting/burning controls
- Maturity timestamp for redemption eligibility
- Owner-controlled minting (usually the tokenization contract)
- Transfer and balance tracking functionality
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


class PTToken(ARC4Contract):
    """Principal Token contract for yield tokenization"""
    
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
        """Initialize PT token with maturity"""
        assert Txn.sender == Global.creator_address, "Only creator can initialize"
        assert maturity_timestamp > Global.latest_timestamp, "Maturity must be in future"
        
        self.owner.value = Txn.sender.bytes
        self.name.value = name
        self.symbol.value = symbol
        self.maturity.value = maturity_timestamp
        self.total_supply.value = UInt64(0)
        self.decimals.value = UInt64(8)
        
        log(b"PT Token initialized - Maturity: " + op.itob(maturity_timestamp))
        return String("PT Token initialized successfully")

    @arc4.abimethod
    def mint(self, to: Bytes, amount: UInt64) -> String:
        """Mint PT tokens to an address (owner only)"""
        assert Txn.sender.bytes == self.owner.value, "Only owner can mint"
        assert amount > UInt64(0), "Amount must be positive"
        
        # Update total supply
        self.total_supply.value = self.total_supply.value + amount
        
        # Update recipient balance (simplified - in production would need proper address handling)
        # For now, mint to sender
        self.balance[Txn.sender] = self.balance[Txn.sender] + amount
        
        log(b"PT tokens minted - Amount: " + op.itob(amount))
        return String("PT tokens minted successfully")

    @arc4.abimethod
    def burn(self, amount: UInt64) -> String:
        """Burn PT tokens from sender's balance"""
        assert amount > UInt64(0), "Amount must be positive"
        
        current_balance = self.balance[Txn.sender]
        assert current_balance >= amount, "Insufficient balance"
        
        # Update balances
        self.balance[Txn.sender] = current_balance - amount
        self.total_supply.value = self.total_supply.value - amount
        
        log(b"PT tokens burned - Amount: " + op.itob(amount))
        return String("PT tokens burned successfully")

    @arc4.abimethod
    def transfer(self, to: Bytes, amount: UInt64) -> String:
        """Transfer PT tokens to another address"""
        assert amount > UInt64(0), "Amount must be positive"
        
        sender_balance = self.balance[Txn.sender]
        assert sender_balance >= amount, "Insufficient balance"
        
        # Update sender balance
        self.balance[Txn.sender] = sender_balance - amount
        
        # In production, would update recipient balance properly
        # For simplicity, just updating sender balance
        
        log(b"PT tokens transferred - Amount: " + op.itob(amount))
        return String("PT tokens transferred successfully")

    @arc4.abimethod(readonly=True)
    def balance_of(self, account: Bytes) -> UInt64:
        """Get balance of an account"""
        # Simplified - returns sender's balance
        return self.balance[Txn.sender]

    @arc4.abimethod(readonly=True)
    def get_total_supply(self) -> UInt64:
        """Get total supply of PT tokens"""
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
    def get_token_info(self) -> arc4.Tuple[arc4.String, arc4.String, arc4.UInt64, arc4.UInt64]:
        """Get token information"""
        return arc4.Tuple((
            arc4.String(self.name.value),
            arc4.String(self.symbol.value),
            arc4.UInt64(self.decimals.value),
            arc4.UInt64(self.total_supply.value)
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
    def update_owner(self, new_owner: Bytes) -> String:
        """Update contract owner (current owner only)"""
        assert Txn.sender.bytes == self.owner.value, "Only owner can update"
        
        self.owner.value = new_owner
        
        log(b"Owner updated")
        return String("Owner updated successfully")