"""
Simple AMM (Automated Market Maker) Smart Contract for Algorand

Provides basic Automated Market Maker functionality for PT/YT token pairs.
Uses constant product formula (x * y = k) with configurable fees.

Key Features:
- Constant product AMM for token swaps
- Configurable swap fees (default 0.3%)
- Liquidity provision and removal
- Price discovery for PT/YT tokens
- Pausable for emergency situations
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


class SimpleAMM(ARC4Contract):
    """Simple AMM for PT/YT token trading"""
    
    def __init__(self) -> None:
        # Global state for AMM configuration
        self.admin = GlobalState(Bytes, key="admin")
        self.reserve_a = GlobalState(UInt64, key="reserve_a")
        self.reserve_b = GlobalState(UInt64, key="reserve_b")
        self.fee_rate = GlobalState(UInt64, key="fee_rate")
        self.is_paused = GlobalState(UInt64, key="is_paused")
        self.total_liquidity = GlobalState(UInt64, key="total_liquidity")
        
        # Constants
        self.fee_denominator = UInt64(1000)
        
        # Local state for user liquidity positions
        self.liquidity_balance = LocalState(UInt64, key="liquidity_balance")
        self.token_a_deposited = LocalState(UInt64, key="token_a_deposited")
        self.token_b_deposited = LocalState(UInt64, key="token_b_deposited")

    @arc4.abimethod
    def initialize(self) -> String:
        """Initialize the AMM"""
        assert Txn.sender == Global.creator_address, "Only creator can initialize"
        
        self.admin.value = Txn.sender.bytes
        self.reserve_a.value = UInt64(0)
        self.reserve_b.value = UInt64(0)
        self.fee_rate.value = UInt64(3)  # 0.3%
        self.is_paused.value = UInt64(0)
        self.total_liquidity.value = UInt64(0)
        
        log(b"SimpleAMM initialized")
        return String("AMM initialized successfully")

    @arc4.abimethod
    def add_liquidity(
        self,
        amount_a: UInt64,
        amount_b: UInt64,
    ) -> String:
        """Add liquidity to the pool"""
        assert self.is_paused.value == UInt64(0), "AMM is paused"
        assert amount_a > UInt64(0) and amount_b > UInt64(0), "Amounts must be positive"
        
        current_reserve_a = self.reserve_a.value
        current_reserve_b = self.reserve_b.value
        
        # For first liquidity provision, accept any ratio
        if current_reserve_a == UInt64(0) and current_reserve_b == UInt64(0):
            self.reserve_a.value = amount_a
            self.reserve_b.value = amount_b
            
            # Calculate initial liquidity tokens (geometric mean)
            liquidity_tokens = self._sqrt(amount_a * amount_b)
            
            self.liquidity_balance[Txn.sender] = liquidity_tokens
            self.total_liquidity.value = liquidity_tokens
        else:
            # Maintain current ratio for subsequent additions
            # Calculate required amounts to maintain ratio
            required_b = (amount_a * current_reserve_b) // current_reserve_a
            required_a = (amount_b * current_reserve_a) // current_reserve_b
            
            # Use the smaller ratio to avoid over-depositing
            if required_b <= amount_b:
                # Use amount_a and calculated required_b
                self.reserve_a.value = current_reserve_a + amount_a
                self.reserve_b.value = current_reserve_b + required_b
                
                # Calculate liquidity tokens proportional to contribution
                liquidity_tokens = (amount_a * self.total_liquidity.value) // current_reserve_a
            else:
                # Use amount_b and calculated required_a
                self.reserve_a.value = current_reserve_a + required_a
                self.reserve_b.value = current_reserve_b + amount_b
                
                # Calculate liquidity tokens proportional to contribution
                liquidity_tokens = (amount_b * self.total_liquidity.value) // current_reserve_b
            
            self.liquidity_balance[Txn.sender] = self.liquidity_balance[Txn.sender] + liquidity_tokens
            self.total_liquidity.value = self.total_liquidity.value + liquidity_tokens
        
        # Track user deposits
        self.token_a_deposited[Txn.sender] = self.token_a_deposited[Txn.sender] + amount_a
        self.token_b_deposited[Txn.sender] = self.token_b_deposited[Txn.sender] + amount_b
        
        log(b"Liquidity added - A: " + op.itob(amount_a) + b" B: " + op.itob(amount_b))
        return String("Liquidity added successfully")

    @arc4.abimethod
    def swap_a_for_b(self, amount_in: UInt64) -> String:
        """Swap token A for token B"""
        assert self.is_paused.value == UInt64(0), "AMM is paused"
        assert amount_in > UInt64(0), "Amount must be positive"
        
        current_reserve_a = self.reserve_a.value
        current_reserve_b = self.reserve_b.value
        
        assert current_reserve_a > UInt64(0) and current_reserve_b > UInt64(0), "Insufficient liquidity"
        
        # Calculate output amount using constant product formula with fees
        amount_out = self._get_amount_out(amount_in, current_reserve_a, current_reserve_b)
        assert amount_out > UInt64(0), "Insufficient output amount"
        assert amount_out <= current_reserve_b, "Insufficient liquidity"
        
        # Update reserves
        self.reserve_a.value = current_reserve_a + amount_in
        self.reserve_b.value = current_reserve_b - amount_out
        
        log(b"Swap A->B - In: " + op.itob(amount_in) + b" Out: " + op.itob(amount_out))
        return String("Swap completed successfully")

    @arc4.abimethod
    def swap_b_for_a(self, amount_in: UInt64) -> String:
        """Swap token B for token A"""
        assert self.is_paused.value == UInt64(0), "AMM is paused"
        assert amount_in > UInt64(0), "Amount must be positive"
        
        current_reserve_a = self.reserve_a.value
        current_reserve_b = self.reserve_b.value
        
        assert current_reserve_a > UInt64(0) and current_reserve_b > UInt64(0), "Insufficient liquidity"
        
        # Calculate output amount using constant product formula with fees
        amount_out = self._get_amount_out(amount_in, current_reserve_b, current_reserve_a)
        assert amount_out > UInt64(0), "Insufficient output amount"
        assert amount_out <= current_reserve_a, "Insufficient liquidity"
        
        # Update reserves
        self.reserve_b.value = current_reserve_b + amount_in
        self.reserve_a.value = current_reserve_a - amount_out
        
        log(b"Swap B->A - In: " + op.itob(amount_in) + b" Out: " + op.itob(amount_out))
        return String("Swap completed successfully")

    @arc4.abimethod(readonly=True)
    def get_reserves(self) -> arc4.Tuple[arc4.UInt64, arc4.UInt64]:
        """Get current reserves"""
        return arc4.Tuple((arc4.UInt64(self.reserve_a.value), arc4.UInt64(self.reserve_b.value)))

    @arc4.abimethod(readonly=True)
    def get_amount_out(
        self,
        amount_in: UInt64,
        reserve_in: UInt64,
        reserve_out: UInt64,
    ) -> UInt64:
        """Calculate output amount for a given input"""
        return self._get_amount_out(amount_in, reserve_in, reserve_out)

    @arc4.abimethod(readonly=True)
    def get_user_liquidity(self) -> arc4.Tuple[arc4.UInt64, arc4.UInt64, arc4.UInt64]:
        """Get user's liquidity position"""
        return arc4.Tuple((
            arc4.UInt64(self.liquidity_balance[Txn.sender]),
            arc4.UInt64(self.token_a_deposited[Txn.sender]),
            arc4.UInt64(self.token_b_deposited[Txn.sender])
        ))

    @arc4.abimethod(readonly=True)
    def get_pool_info(self) -> arc4.Tuple[arc4.UInt64, arc4.UInt64, arc4.UInt64, arc4.UInt64]:
        """Get pool information"""
        return arc4.Tuple((
            arc4.UInt64(self.reserve_a.value),
            arc4.UInt64(self.reserve_b.value),
            arc4.UInt64(self.total_liquidity.value),
            arc4.UInt64(self.fee_rate.value)
        ))

    @arc4.abimethod
    def remove_liquidity(self, liquidity_amount: UInt64) -> String:
        """Remove liquidity from the pool"""
        assert self.is_paused.value == UInt64(0), "AMM is paused"
        assert liquidity_amount > UInt64(0), "Amount must be positive"
        
        user_liquidity = self.liquidity_balance[Txn.sender]
        assert user_liquidity >= liquidity_amount, "Insufficient liquidity balance"
        
        current_reserve_a = self.reserve_a.value
        current_reserve_b = self.reserve_b.value
        total_liquidity = self.total_liquidity.value
        
        # Calculate proportional amounts to withdraw
        amount_a = (liquidity_amount * current_reserve_a) // total_liquidity
        amount_b = (liquidity_amount * current_reserve_b) // total_liquidity
        
        # Update reserves and liquidity
        self.reserve_a.value = current_reserve_a - amount_a
        self.reserve_b.value = current_reserve_b - amount_b
        self.liquidity_balance[Txn.sender] = user_liquidity - liquidity_amount
        self.total_liquidity.value = total_liquidity - liquidity_amount
        
        # Update user deposits
        if self.token_a_deposited[Txn.sender] >= amount_a:
            self.token_a_deposited[Txn.sender] = self.token_a_deposited[Txn.sender] - amount_a
        
        if self.token_b_deposited[Txn.sender] >= amount_b:
            self.token_b_deposited[Txn.sender] = self.token_b_deposited[Txn.sender] - amount_b
        
        log(b"Liquidity removed - A: " + op.itob(amount_a) + b" B: " + op.itob(amount_b))
        return String("Liquidity removed successfully")

    @arc4.abimethod
    def set_fee_rate(self, new_fee: UInt64) -> String:
        """Set swap fee rate (admin only)"""
        assert Txn.sender.bytes == self.admin.value, "Only admin can set fee"
        assert new_fee < self.fee_denominator, "Fee too high"
        
        old_fee = self.fee_rate.value
        self.fee_rate.value = new_fee
        
        log(b"Fee updated - Old: " + op.itob(old_fee) + b" New: " + op.itob(new_fee))
        return String("Fee rate updated successfully")

    @arc4.abimethod
    def pause_amm(self) -> String:
        """Pause the AMM (admin only)"""
        assert Txn.sender.bytes == self.admin.value, "Only admin can pause"
        self.is_paused.value = UInt64(1)
        
        log(b"AMM paused")
        return String("AMM paused")

    @arc4.abimethod
    def unpause_amm(self) -> String:
        """Unpause the AMM (admin only)"""
        assert Txn.sender.bytes == self.admin.value, "Only admin can unpause"
        self.is_paused.value = UInt64(0)
        
        log(b"AMM unpaused")
        return String("AMM unpaused")

    @subroutine
    def _get_amount_out(
        self,
        amount_in: UInt64,
        reserve_in: UInt64,
        reserve_out: UInt64,
    ) -> UInt64:
        """Internal function to calculate output amount using constant product formula"""
        assert amount_in > UInt64(0), "Amount must be positive"
        assert reserve_in > UInt64(0) and reserve_out > UInt64(0), "Insufficient liquidity"
        
        # Apply fee: amount_in_with_fee = amount_in * (1000 - fee_rate)
        amount_in_with_fee = amount_in * (self.fee_denominator - self.fee_rate.value)
        
        # Constant product formula: (x + dx) * (y - dy) = x * y
        # Solving for dy: dy = (y * dx) / (x + dx)
        numerator = amount_in_with_fee * reserve_out
        denominator = reserve_in * self.fee_denominator + amount_in_with_fee
        
        return numerator // denominator

    @subroutine
    def _sqrt(self, x: UInt64) -> UInt64:
        """Calculate square root using Newton's method (simplified)"""
        if x == UInt64(0):
            return UInt64(0)
        
        # Initial guess
        z = x
        y = (x + UInt64(1)) // UInt64(2)
        
        # Newton's method iterations (limited for gas efficiency)
        counter = UInt64(0)
        while y < z and counter < UInt64(10):
            z = y
            y = (x // y + y) // UInt64(2)
            counter = counter + UInt64(1)
        
        return z
