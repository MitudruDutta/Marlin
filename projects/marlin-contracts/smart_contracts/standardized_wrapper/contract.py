"""
Standardized Token Wrapper Smart Contract for Algorand

This contract wraps multiple underlying yield-bearing tokens (like stALGO, stUSDC) 
into a single standardized format (SY tokens). It serves as the entry point for users.

Key Features:
- Wrap multiple tokens according to configured ratios
- Unwrap SY tokens back to underlying tokens
- Configurable token ratios and yield rates
- Pausable for emergency situations

Usage Example:
- 100 stALGO + 200 stUSDC → 150 SY tokens (based on configured ratios)
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


class StandardizedWrapper(ARC4Contract):
    """Standardized token wrapper for multiple yield-bearing tokens"""
    
    def __init__(self) -> None:
        # Global state for wrapper configuration
        self.admin = GlobalState(Bytes, key="admin")
        self.name = GlobalState(String, key="name")
        self.symbol = GlobalState(String, key="symbol")
        self.yield_rate_bps = GlobalState(UInt64, key="yield_rate_bps")
        self.is_paused = GlobalState(UInt64, key="is_paused")
        self.total_supply = GlobalState(UInt64, key="total_supply")
        
        # Token configuration (simplified - in production would use boxes for multiple tokens)
        self.token0_ratio = GlobalState(UInt64, key="token0_ratio")
        self.token1_ratio = GlobalState(UInt64, key="token1_ratio")
        self.token0_enabled = GlobalState(UInt64, key="token0_enabled")
        self.token1_enabled = GlobalState(UInt64, key="token1_enabled")
        
        # Local state for user balances
        self.sy_balance = LocalState(UInt64, key="sy_balance")
        self.token0_deposited = LocalState(UInt64, key="token0_deposited")
        self.token1_deposited = LocalState(UInt64, key="token1_deposited")

    @arc4.abimethod
    def initialize(
        self,
        name: String,
        symbol: String,
        yield_rate_bps: UInt64,
    ) -> String:
        """Initialize the standardized wrapper"""
        assert Txn.sender == Global.creator_address, "Only creator can initialize"
        assert yield_rate_bps <= UInt64(10000), "Yield rate cannot exceed 100%"
        
        self.admin.value = Txn.sender.bytes
        self.name.value = name
        self.symbol.value = symbol
        self.yield_rate_bps.value = yield_rate_bps
        self.is_paused.value = UInt64(0)
        self.total_supply.value = UInt64(0)
        self.token0_ratio.value = UInt64(5000)  # 50%
        self.token1_ratio.value = UInt64(5000)  # 50%
        self.token0_enabled.value = UInt64(1)
        self.token1_enabled.value = UInt64(1)
        
        log(b"StandardizedWrapper initialized")
        return String("Wrapper initialized successfully")

    @arc4.abimethod
    def configure_token(
        self,
        token_index: UInt64,
        ratio: UInt64,
        is_enabled: UInt64,
    ) -> String:
        """Configure a token for wrapping"""
        assert Txn.sender.bytes == self.admin.value, "Only admin can configure"
        assert ratio <= UInt64(10000), "Ratio cannot exceed 100%"
        assert token_index <= UInt64(1), "Only tokens 0 and 1 supported"
        
        if token_index == UInt64(0):
            self.token0_ratio.value = ratio
            self.token0_enabled.value = is_enabled
        else:
            self.token1_ratio.value = ratio
            self.token1_enabled.value = is_enabled
        
        log(b"Token configured - Index: " + op.itob(token_index) + b" Ratio: " + op.itob(ratio))
        return String("Token configured successfully")

    @arc4.abimethod
    def wrap_tokens(
        self,
        amount0: UInt64,
        amount1: UInt64,
    ) -> String:
        """Wrap multiple tokens into SY tokens"""
        assert self.is_paused.value == UInt64(0), "Wrapper is paused"
        assert amount0 > UInt64(0) or amount1 > UInt64(0), "At least one amount must be positive"
        
        wrapped_amount = UInt64(0)
        
        # Process token 0
        if amount0 > UInt64(0):
            assert self.token0_enabled.value == UInt64(1), "Token 0 not enabled"
            wrapped_0 = (amount0 * self.token0_ratio.value) // UInt64(10000)
            wrapped_amount = wrapped_amount + wrapped_0
            self.token0_deposited[Txn.sender] = self.token0_deposited[Txn.sender] + amount0
        
        # Process token 1
        if amount1 > UInt64(0):
            assert self.token1_enabled.value == UInt64(1), "Token 1 not enabled"
            wrapped_1 = (amount1 * self.token1_ratio.value) // UInt64(10000)
            wrapped_amount = wrapped_amount + wrapped_1
            self.token1_deposited[Txn.sender] = self.token1_deposited[Txn.sender] + amount1
        
        assert wrapped_amount > UInt64(0), "Wrapped amount must be positive"
        
        # Update balances
        self.sy_balance[Txn.sender] = self.sy_balance[Txn.sender] + wrapped_amount
        self.total_supply.value = self.total_supply.value + wrapped_amount
        
        log(b"Tokens wrapped - Amount: " + op.itob(wrapped_amount))
        return String("Tokens wrapped successfully")

    @arc4.abimethod
    def unwrap_tokens(self, amount: UInt64) -> String:
        """Unwrap SY tokens back to underlying tokens"""
        assert self.is_paused.value == UInt64(0), "Wrapper is paused"
        assert amount > UInt64(0), "Amount must be positive"
        
        current_sy_balance = self.sy_balance[Txn.sender]
        assert current_sy_balance >= amount, "Insufficient SY balance"
        
        # Calculate unwrap amounts based on ratios
        unwrap_amount0 = UInt64(0)
        unwrap_amount1 = UInt64(0)
        
        if self.token0_enabled.value == UInt64(1):
            unwrap_amount0 = (amount * self.token0_ratio.value) // UInt64(10000)
        
        if self.token1_enabled.value == UInt64(1):
            unwrap_amount1 = (amount * self.token1_ratio.value) // UInt64(10000)
        
        # Update balances
        self.sy_balance[Txn.sender] = current_sy_balance - amount
        self.total_supply.value = self.total_supply.value - amount
        
        # In production, would transfer actual underlying tokens back
        # For simplicity, just updating deposited amounts
        if unwrap_amount0 > UInt64(0):
            current_deposited0 = self.token0_deposited[Txn.sender]
            if current_deposited0 >= unwrap_amount0:
                self.token0_deposited[Txn.sender] = current_deposited0 - unwrap_amount0
        
        if unwrap_amount1 > UInt64(0):
            current_deposited1 = self.token1_deposited[Txn.sender]
            if current_deposited1 >= unwrap_amount1:
                self.token1_deposited[Txn.sender] = current_deposited1 - unwrap_amount1
        
        log(b"Tokens unwrapped - Amount: " + op.itob(amount))
        return String("Tokens unwrapped successfully")

    @arc4.abimethod(readonly=True)
    def get_user_balances(self) -> arc4.Tuple[arc4.UInt64, arc4.UInt64, arc4.UInt64]:
        """Get user's SY balance and deposited token amounts"""
        return arc4.Tuple((
            arc4.UInt64(self.sy_balance[Txn.sender]),
            arc4.UInt64(self.token0_deposited[Txn.sender]),
            arc4.UInt64(self.token1_deposited[Txn.sender])
        ))

    @arc4.abimethod(readonly=True)
    def get_token_config(self, token_index: UInt64) -> arc4.Tuple[arc4.UInt64, arc4.UInt64]:
        """Get token configuration (ratio and enabled status)"""
        if token_index == UInt64(0):
            return arc4.Tuple((arc4.UInt64(self.token0_ratio.value), arc4.UInt64(self.token0_enabled.value)))
        else:
            return arc4.Tuple((arc4.UInt64(self.token1_ratio.value), arc4.UInt64(self.token1_enabled.value)))

    @arc4.abimethod(readonly=True)
    def get_yield_rate(self) -> UInt64:
        """Get current yield rate in basis points"""
        return self.yield_rate_bps.value

    @arc4.abimethod(readonly=True)
    def get_total_supply(self) -> UInt64:
        """Get total supply of SY tokens"""
        return self.total_supply.value

    @arc4.abimethod(readonly=True)
    def calculate_wrap_amount(self, amount0: UInt64, amount1: UInt64) -> UInt64:
        """Calculate how many SY tokens would be received for given amounts"""
        wrapped_amount = UInt64(0)
        
        if amount0 > UInt64(0) and self.token0_enabled.value == UInt64(1):
            wrapped_0 = (amount0 * self.token0_ratio.value) // UInt64(10000)
            wrapped_amount = wrapped_amount + wrapped_0
        
        if amount1 > UInt64(0) and self.token1_enabled.value == UInt64(1):
            wrapped_1 = (amount1 * self.token1_ratio.value) // UInt64(10000)
            wrapped_amount = wrapped_amount + wrapped_1
        
        return wrapped_amount

    @arc4.abimethod
    def set_yield_rate(self, new_rate: UInt64) -> String:
        """Update yield rate (admin only)"""
        assert Txn.sender.bytes == self.admin.value, "Only admin can set yield rate"
        assert new_rate <= UInt64(10000), "Yield rate cannot exceed 100%"
        
        old_rate = self.yield_rate_bps.value
        self.yield_rate_bps.value = new_rate
        
        log(b"Yield rate updated - Old: " + op.itob(old_rate) + b" New: " + op.itob(new_rate))
        return String("Yield rate updated successfully")

    @arc4.abimethod
    def pause_wrapper(self) -> String:
        """Pause the wrapper (admin only)"""
        assert Txn.sender.bytes == self.admin.value, "Only admin can pause"
        self.is_paused.value = UInt64(1)
        
        log(b"Wrapper paused")
        return String("Wrapper paused")

    @arc4.abimethod
    def unpause_wrapper(self) -> String:
        """Unpause the wrapper (admin only)"""
        assert Txn.sender.bytes == self.admin.value, "Only admin can unpause"
        self.is_paused.value = UInt64(0)
        
        log(b"Wrapper unpaused")
        return String("Wrapper unpaused")

    @arc4.abimethod(readonly=True)
    def is_wrapper_paused(self) -> UInt64:
        """Check if wrapper is paused"""
        return self.is_paused.value