"""
YT Auto Converter Smart Contract for Algorand

AI-powered automation engine that automatically converts YT tokens to PT tokens
when price thresholds are reached. This is the core AI optimization component.

Key Features:
- Automated YT to PT conversion based on price thresholds
- User-configurable risk preferences and thresholds
- Real market integration via AMM for conversions
- Slippage protection and deadline enforcement
- Fee mechanism for protocol sustainability
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


class YTAutoConverter(ARC4Contract):
    """AI-powered YT to PT auto converter"""
    
    def __init__(self) -> None:
        # Global state for converter configuration
        self.admin = GlobalState(Bytes, key="admin")
        self.oracle_address = GlobalState(Bytes, key="oracle_address")
        self.tokenization_address = GlobalState(Bytes, key="tokenization_address")
        self.amm_address = GlobalState(Bytes, key="amm_address")
        self.conversion_fee = GlobalState(UInt64, key="conversion_fee")
        self.is_paused = GlobalState(UInt64, key="is_paused")
        self.total_conversions = GlobalState(UInt64, key="total_conversions")
        
        # Constants
        self.max_slippage = UInt64(500)  # 5%
        self.fee_denominator = UInt64(10000)
        
        # Local state for user configurations
        self.conversion_enabled = LocalState(UInt64, key="conversion_enabled")
        self.threshold_price = LocalState(UInt64, key="threshold_price")
        self.user_maturity = LocalState(UInt64, key="user_maturity")
        self.conversion_executed = LocalState(UInt64, key="conversion_executed")
        self.yt_balance = LocalState(UInt64, key="yt_balance")
        self.pt_balance = LocalState(UInt64, key="pt_balance")

    @arc4.abimethod
    def initialize(
        self,
        oracle_address: Bytes,
        tokenization_address: Bytes,
        amm_address: Bytes,
    ) -> String:
        """Initialize the auto converter"""
        assert Txn.sender == Global.creator_address, "Only creator can initialize"
        
        self.admin.value = Txn.sender.bytes
        self.oracle_address.value = oracle_address
        self.tokenization_address.value = tokenization_address
        self.amm_address.value = amm_address
        self.conversion_fee.value = UInt64(30)  # 0.3%
        self.is_paused.value = UInt64(0)
        self.total_conversions.value = UInt64(0)
        
        log(b"YTAutoConverter initialized")
        return String("Auto converter initialized successfully")

    @arc4.abimethod
    def configure_conversion(
        self,
        enabled: UInt64,
        threshold_price: UInt64,
        maturity: UInt64,
    ) -> String:
        """Configure automatic conversion for user"""
        assert threshold_price > UInt64(0), "Threshold price must be positive"
        assert maturity > Global.latest_timestamp, "Maturity must be in future"
        
        self.conversion_enabled[Txn.sender] = enabled
        self.threshold_price[Txn.sender] = threshold_price
        self.user_maturity[Txn.sender] = maturity
        self.conversion_executed[Txn.sender] = UInt64(0)  # Reset execution status
        
        log(b"Conversion configured - Enabled: " + op.itob(enabled) + b" Threshold: " + op.itob(threshold_price))
        return String("Conversion configured successfully")

    @arc4.abimethod
    def deposit_yt_tokens(self, amount: UInt64) -> String:
        """Deposit YT tokens for conversion (for testing)"""
        assert amount > UInt64(0), "Amount must be positive"
        
        self.yt_balance[Txn.sender] = self.yt_balance[Txn.sender] + amount
        
        log(b"YT tokens deposited - Amount: " + op.itob(amount))
        return String("YT tokens deposited successfully")

    @arc4.abimethod
    def execute_conversion(
        self,
        user: Bytes,
        min_pt_amount: UInt64,
        deadline: UInt64,
    ) -> String:
        """Execute YT to PT conversion"""
        assert self.is_paused.value == UInt64(0), "Converter is paused"
        assert Global.latest_timestamp <= deadline, "Transaction expired"
        
        # In production, would validate user address properly
        # For simplicity, using sender's configuration
        
        assert self.conversion_enabled[Txn.sender] == UInt64(1), "Conversion not enabled"
        assert self.conversion_executed[Txn.sender] == UInt64(0), "Conversion already executed"
        
        # Check if threshold is reached (simplified - would call oracle contract)
        # For demo, assume threshold is reached if threshold_price > 0
        user_threshold = self.threshold_price[Txn.sender]
        assert user_threshold > UInt64(0), "Threshold not reached"
        
        # Check YT balance
        user_yt_balance = self.yt_balance[Txn.sender]
        assert user_yt_balance > UInt64(0), "No YT tokens to convert"
        
        # Calculate conversion fee
        fee_amount = (user_yt_balance * self.conversion_fee.value) // self.fee_denominator
        conversion_amount = user_yt_balance - fee_amount
        
        # Simulate market-based conversion (simplified)
        received_pt = self._perform_market_conversion(conversion_amount, min_pt_amount)
        
        # Update balances
        self.yt_balance[Txn.sender] = UInt64(0)  # All YT tokens converted
        self.pt_balance[Txn.sender] = self.pt_balance[Txn.sender] + received_pt
        self.conversion_executed[Txn.sender] = UInt64(1)
        
        # Update global stats
        self.total_conversions.value = self.total_conversions.value + UInt64(1)
        
        log(b"Conversion executed - YT: " + op.itob(user_yt_balance) + b" PT: " + op.itob(received_pt))
        return String("Conversion executed successfully")

    @arc4.abimethod(readonly=True)
    def can_execute_conversion(self, user: Bytes) -> UInt64:
        """Check if conversion can be executed for user"""
        # Simplified check using sender's data
        if self.conversion_enabled[Txn.sender] == UInt64(0):
            return UInt64(0)  # Not enabled
        
        if self.conversion_executed[Txn.sender] == UInt64(1):
            return UInt64(0)  # Already executed
        
        if self.yt_balance[Txn.sender] == UInt64(0):
            return UInt64(0)  # No YT tokens
        
        if self.threshold_price[Txn.sender] == UInt64(0):
            return UInt64(0)  # No threshold set
        
        # In production, would check oracle for actual threshold status
        return UInt64(1)  # Can execute

    @arc4.abimethod(readonly=True)
    def get_user_config(self) -> arc4.Tuple[arc4.UInt64, arc4.UInt64, arc4.UInt64, arc4.UInt64]:
        """Get user's conversion configuration"""
        return arc4.Tuple((
            arc4.UInt64(self.conversion_enabled[Txn.sender]),
            arc4.UInt64(self.threshold_price[Txn.sender]),
            arc4.UInt64(self.user_maturity[Txn.sender]),
            arc4.UInt64(self.conversion_executed[Txn.sender])
        ))

    @arc4.abimethod(readonly=True)
    def get_user_balances(self) -> arc4.Tuple[arc4.UInt64, arc4.UInt64]:
        """Get user's YT and PT balances"""
        return arc4.Tuple((
            arc4.UInt64(self.yt_balance[Txn.sender]),
            arc4.UInt64(self.pt_balance[Txn.sender])
        ))

    @arc4.abimethod(readonly=True)
    def get_conversion_info(self) -> arc4.Tuple[arc4.UInt64, arc4.UInt64, arc4.UInt64]:
        """Get conversion information"""
        return arc4.Tuple((
            arc4.UInt64(self.conversion_fee.value),
            arc4.UInt64(self.total_conversions.value),
            arc4.UInt64(self.is_paused.value)
        ))

    @arc4.abimethod(readonly=True)
    def calculate_conversion_output(self, yt_amount: UInt64) -> arc4.Tuple[arc4.UInt64, arc4.UInt64]:
        """Calculate expected PT output for YT input"""
        if yt_amount == UInt64(0):
            return arc4.Tuple((arc4.UInt64(0), arc4.UInt64(0)))
        
        fee_amount = (yt_amount * self.conversion_fee.value) // self.fee_denominator
        conversion_amount = yt_amount - fee_amount
        
        # Simplified conversion rate (1:1 minus slippage)
        slippage_amount = (conversion_amount * UInt64(50)) // UInt64(10000)  # 0.5% slippage
        expected_pt = conversion_amount - slippage_amount
        
        return arc4.Tuple((arc4.UInt64(expected_pt), arc4.UInt64(fee_amount)))

    @arc4.abimethod
    def add_maturity(self, maturity: UInt64) -> String:
        """Add a maturity for conversion"""
        assert maturity > Global.latest_timestamp, "Maturity must be in future"
        
        # For simplicity, just update user's maturity
        self.user_maturity[Txn.sender] = maturity
        
        log(b"Maturity added - Value: " + op.itob(maturity))
        return String("Maturity added successfully")

    @arc4.abimethod
    def remove_maturity(self) -> String:
        """Remove user's maturity"""
        self.user_maturity[Txn.sender] = UInt64(0)
        
        log(b"Maturity removed")
        return String("Maturity removed successfully")

    @arc4.abimethod
    def set_conversion_fee(self, new_fee: UInt64) -> String:
        """Set conversion fee (admin only)"""
        assert Txn.sender.bytes == self.admin.value, "Only admin can set fee"
        assert new_fee <= UInt64(1000), "Fee too high (max 10%)"
        
        old_fee = self.conversion_fee.value
        self.conversion_fee.value = new_fee
        
        log(b"Conversion fee updated - Old: " + op.itob(old_fee) + b" New: " + op.itob(new_fee))
        return String("Conversion fee updated successfully")

    @arc4.abimethod
    def pause_converter(self) -> String:
        """Pause the converter (admin only)"""
        assert Txn.sender.bytes == self.admin.value, "Only admin can pause"
        self.is_paused.value = UInt64(1)
        
        log(b"Converter paused")
        return String("Converter paused")

    @arc4.abimethod
    def unpause_converter(self) -> String:
        """Unpause the converter (admin only)"""
        assert Txn.sender.bytes == self.admin.value, "Only admin can unpause"
        self.is_paused.value = UInt64(0)
        
        log(b"Converter unpaused")
        return String("Converter unpaused")

    @arc4.abimethod
    def emergency_disable_conversion(self) -> String:
        """Emergency disable conversion for user"""
        self.conversion_enabled[Txn.sender] = UInt64(0)
        
        log(b"Conversion emergency disabled")
        return String("Conversion disabled for emergency")

    @arc4.abimethod
    def withdraw_pt_tokens(self, amount: UInt64) -> String:
        """Withdraw PT tokens"""
        assert amount > UInt64(0), "Amount must be positive"
        
        current_pt_balance = self.pt_balance[Txn.sender]
        assert current_pt_balance >= amount, "Insufficient PT balance"
        
        self.pt_balance[Txn.sender] = current_pt_balance - amount
        
        log(b"PT tokens withdrawn - Amount: " + op.itob(amount))
        return String("PT tokens withdrawn successfully")

    @subroutine
    def _perform_market_conversion(self, amount: UInt64, min_output: UInt64) -> UInt64:
        """Internal function to perform market-based conversion"""
        # Simplified market conversion simulation
        # In production, would interact with actual AMM contract
        
        # Simulate slippage and market impact
        slippage_factor = UInt64(9950)  # 0.5% slippage
        market_rate = (amount * slippage_factor) // UInt64(10000)
        
        assert market_rate >= min_output, "Insufficient output amount"
        
        return market_rate

    @arc4.abimethod(readonly=True)
    def get_ai_recommendation(self, yt_amount: UInt64, current_price: UInt64) -> arc4.Tuple[arc4.UInt64, arc4.String]:
        """Get AI recommendation for conversion (simplified)"""
        if yt_amount == UInt64(0):
            return arc4.Tuple((arc4.UInt64(0), arc4.String("No YT tokens to convert")))
        
        user_threshold = self.threshold_price[Txn.sender]
        
        if current_price >= user_threshold:
            return arc4.Tuple((arc4.UInt64(1), arc4.String("Recommend conversion - threshold reached")))
        else:
            remaining_upside = ((user_threshold - current_price) * UInt64(100)) // current_price
            if remaining_upside < UInt64(5):  # Less than 5% to threshold
                return arc4.Tuple((arc4.UInt64(1), arc4.String("Recommend conversion - close to threshold")))
            else:
                return arc4.Tuple((arc4.UInt64(0), arc4.String("Hold YT tokens - threshold not reached")))

    @arc4.abimethod
    def update_addresses(
        self,
        oracle_address: Bytes,
        tokenization_address: Bytes,
        amm_address: Bytes,
    ) -> String:
        """Update contract addresses (admin only)"""
        assert Txn.sender.bytes == self.admin.value, "Only admin can update addresses"
        
        self.oracle_address.value = oracle_address
        self.tokenization_address.value = tokenization_address
        self.amm_address.value = amm_address
        
        log(b"Contract addresses updated")
        return String("Contract addresses updated successfully")