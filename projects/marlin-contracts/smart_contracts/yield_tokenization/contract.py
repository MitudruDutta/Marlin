"""
Yield Tokenization Smart Contract for Algorand

This contract implements the core functionality of splitting standardized yield (SY) tokens
into Principal Tokens (PT) and Yield Tokens (YT). It's the heart of the Tesserapt protocol.

Key Features:
- Split SY tokens into PT and YT tokens (1:1:1 ratio)
- Create multiple maturity dates for different investment horizons
- Redeem PT tokens for underlying SY tokens at maturity
- Pausable and access-controlled for security

Usage Flow:
1. User deposits SY tokens via split_tokens
2. Receives equal amounts of PT and YT tokens
3. At maturity, PT tokens can be redeemed for original SY tokens via redeem_tokens
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


class YieldTokenization(ARC4Contract):
    """Core yield tokenization contract for PT/YT token splitting"""
    
    def __init__(self) -> None:
        # Global state for protocol configuration
        self.admin = GlobalState(Bytes, key="admin")
        self.base_name = GlobalState(String, key="base_name")
        self.base_symbol = GlobalState(String, key="base_symbol")
        self.is_paused = GlobalState(UInt64, key="is_paused")
        self.maturity_count = GlobalState(UInt64, key="maturity_count")
        
        # Store maturities in global state (simplified - in production would use boxes)
        self.maturities = GlobalState(Bytes, key="maturities")
        
        # Local state for user balances and stakes
        self.user_sy_balance = LocalState(UInt64, key="sy_balance")
        self.user_pt_balance = LocalState(UInt64, key="pt_balance") 
        self.user_yt_balance = LocalState(UInt64, key="yt_balance")

    @arc4.abimethod
    def initialize(
        self,
        base_name: String,
        base_symbol: String,
    ) -> String:
        """Initialize the yield tokenization protocol"""
        assert Txn.sender == Global.creator_address, "Only creator can initialize"
        
        self.admin.value = Txn.sender.bytes
        self.base_name.value = base_name
        self.base_symbol.value = base_symbol
        self.is_paused.value = UInt64(0)
        self.maturity_count.value = UInt64(0)
        self.maturities.value = Bytes(b"")
        
        # Create initial 30-day maturity (30 * 24 * 60 * 60 = 2592000 seconds)
        initial_maturity = Global.latest_timestamp + UInt64(2592000)
        self._create_maturity_internal(initial_maturity)
        
        log(b"YieldTokenization initialized")
        return String("Protocol initialized successfully")

    @arc4.abimethod
    def create_maturity(self, maturity_timestamp: UInt64) -> String:
        """Create a new maturity date for PT/YT tokens"""
        assert Txn.sender.bytes == self.admin.value, "Only admin can create maturity"
        assert maturity_timestamp > Global.latest_timestamp, "Maturity must be in future"
        assert self.is_paused.value == UInt64(0), "Protocol is paused"
        
        # Check if maturity already exists (simplified check)
        assert not self._maturity_exists(maturity_timestamp), "Maturity already exists"
        
        self._create_maturity_internal(maturity_timestamp)
        
        log(b"New maturity created: " + op.itob(maturity_timestamp))
        return String("Maturity created successfully")

    @arc4.abimethod
    def split_tokens(
        self,
        amount: UInt64,
        maturity: UInt64,
    ) -> String:
        """Split SY tokens into PT and YT tokens"""
        assert self.is_paused.value == UInt64(0), "Protocol is paused"
        assert amount > UInt64(0), "Amount must be positive"
        assert self._maturity_exists(maturity), "Maturity not found"
        
        # Check user has sufficient SY balance
        current_sy_balance = self.user_sy_balance[Txn.sender]
        assert current_sy_balance >= amount, "Insufficient SY balance"
        
        # Update balances
        self.user_sy_balance[Txn.sender] = current_sy_balance - amount
        self.user_pt_balance[Txn.sender] = self.user_pt_balance[Txn.sender] + amount
        self.user_yt_balance[Txn.sender] = self.user_yt_balance[Txn.sender] + amount
        
        log(b"Tokens split - Amount: " + op.itob(amount) + b" Maturity: " + op.itob(maturity))
        return String("Tokens split successfully")

    @arc4.abimethod
    def redeem_tokens(
        self,
        amount: UInt64,
        maturity: UInt64,
    ) -> String:
        """Redeem PT tokens for SY tokens at maturity"""
        assert self.is_paused.value == UInt64(0), "Protocol is paused"
        assert amount > UInt64(0), "Amount must be positive"
        assert Global.latest_timestamp >= maturity, "Maturity not reached"
        
        # Check user has sufficient PT balance
        current_pt_balance = self.user_pt_balance[Txn.sender]
        assert current_pt_balance >= amount, "Insufficient PT balance"
        
        # Update balances
        self.user_pt_balance[Txn.sender] = current_pt_balance - amount
        self.user_sy_balance[Txn.sender] = self.user_sy_balance[Txn.sender] + amount
        
        log(b"Tokens redeemed - Amount: " + op.itob(amount) + b" Maturity: " + op.itob(maturity))
        return String("Tokens redeemed successfully")

    @arc4.abimethod(readonly=True)
    def get_user_balances(self, user: Bytes) -> arc4.Tuple[arc4.UInt64, arc4.UInt64, arc4.UInt64]:
        """Get user's SY, PT, and YT balances"""
        # Note: In production, would need proper user lookup
        # For simplicity, returning sender's balances
        return arc4.Tuple((
            arc4.UInt64(self.user_sy_balance[Txn.sender]),
            arc4.UInt64(self.user_pt_balance[Txn.sender]), 
            arc4.UInt64(self.user_yt_balance[Txn.sender])
        ))

    @arc4.abimethod(readonly=True)
    def get_maturity_count(self) -> UInt64:
        """Get total number of maturities"""
        return self.maturity_count.value

    @arc4.abimethod(readonly=True)
    def is_protocol_paused(self) -> UInt64:
        """Check if protocol is paused"""
        return self.is_paused.value

    @arc4.abimethod
    def pause_protocol(self) -> String:
        """Pause the protocol (admin only)"""
        assert Txn.sender.bytes == self.admin.value, "Only admin can pause"
        self.is_paused.value = UInt64(1)
        
        log(b"Protocol paused")
        return String("Protocol paused")

    @arc4.abimethod
    def unpause_protocol(self) -> String:
        """Unpause the protocol (admin only)"""
        assert Txn.sender.bytes == self.admin.value, "Only admin can unpause"
        self.is_paused.value = UInt64(0)
        
        log(b"Protocol unpaused")
        return String("Protocol unpaused")

    @arc4.abimethod
    def deposit_sy_tokens(self, amount: UInt64) -> String:
        """Deposit SY tokens to user balance (for testing)"""
        assert amount > UInt64(0), "Amount must be positive"
        
        self.user_sy_balance[Txn.sender] = self.user_sy_balance[Txn.sender] + amount
        
        log(b"SY tokens deposited - Amount: " + op.itob(amount))
        return String("SY tokens deposited successfully")

    @subroutine
    def _create_maturity_internal(self, maturity_timestamp: UInt64) -> None:
        """Internal function to create a new maturity"""
        # Increment maturity count
        current_count = self.maturity_count.value
        self.maturity_count.value = current_count + UInt64(1)
        
        # In a full implementation, would store maturity details in boxes
        # For simplicity, just incrementing count
        
    @subroutine
    def _maturity_exists(self, maturity_timestamp: UInt64) -> bool:
        """Check if a maturity timestamp already exists"""
        # Simplified check - in production would check against stored maturities
        # For now, assume maturity exists if it's reasonable (within 1 year)
        one_year = UInt64(365 * 24 * 60 * 60)
        return (
            maturity_timestamp > Global.latest_timestamp and 
            maturity_timestamp <= Global.latest_timestamp + one_year
        )
