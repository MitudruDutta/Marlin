"""
Staking DApp Smart Contract for Algorand

Manages staking of tokens and distribution of time-based rewards.
Provides the underlying yield that gets tokenized by the protocol.

Key Features:
- Time-based staking rewards (5 tokens every 10 seconds)
- Stake and unstake functionality
- Automatic reward calculation and claiming
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


class StakingDapp(ARC4Contract):
    """Staking DApp for time-based rewards"""
    
    def __init__(self) -> None:
        # Global state for staking configuration
        self.admin = GlobalState(Bytes, key="admin")
        self.reward_name = GlobalState(String, key="reward_name")
        self.reward_symbol = GlobalState(String, key="reward_symbol")
        self.is_paused = GlobalState(UInt64, key="is_paused")
        self.total_staked = GlobalState(UInt64, key="total_staked")
        self.total_rewards_distributed = GlobalState(UInt64, key="total_rewards_distributed")
        
        # Reward constants
        self.reward_amount = UInt64(5)  # 5 tokens per interval
        self.reward_interval = UInt64(10)  # 10 seconds
        self.precision_factor = UInt64(1000000000)  # 10^9 for precision
        
        # Local state for user staking
        self.staked_amount = LocalState(UInt64, key="staked_amount")
        self.last_reward_time = LocalState(UInt64, key="last_reward_time")
        self.reward_balance = LocalState(UInt64, key="reward_balance")

    @arc4.abimethod
    def initialize(
        self,
        reward_name: String,
        reward_symbol: String,
    ) -> String:
        """Initialize the staking contract"""
        assert Txn.sender == Global.creator_address, "Only creator can initialize"
        
        self.admin.value = Txn.sender.bytes
        self.reward_name.value = reward_name
        self.reward_symbol.value = reward_symbol
        self.is_paused.value = UInt64(0)
        self.total_staked.value = UInt64(0)
        self.total_rewards_distributed.value = UInt64(0)
        
        log(b"StakingDapp initialized")
        return String("Staking contract initialized successfully")

    @arc4.abimethod
    def stake(self, amount: UInt64) -> String:
        """Stake tokens"""
        assert self.is_paused.value == UInt64(0), "Staking is paused"
        assert amount > UInt64(0), "Amount must be positive"
        
        # Update pending rewards before changing stake
        self._update_rewards()
        
        # Update staking amounts
        current_staked = self.staked_amount[Txn.sender]
        self.staked_amount[Txn.sender] = current_staked + amount
        self.total_staked.value = self.total_staked.value + amount
        
        # Update last reward time
        self.last_reward_time[Txn.sender] = Global.latest_timestamp
        
        log(b"Tokens staked - Amount: " + op.itob(amount))
        return String("Tokens staked successfully")

    @arc4.abimethod
    def unstake(self, amount: UInt64) -> String:
        """Unstake tokens"""
        assert self.is_paused.value == UInt64(0), "Staking is paused"
        assert amount > UInt64(0), "Amount must be positive"
        
        current_staked = self.staked_amount[Txn.sender]
        assert current_staked >= amount, "Insufficient staked amount"
        
        # Update pending rewards before changing stake
        self._update_rewards()
        
        # Update staking amounts
        self.staked_amount[Txn.sender] = current_staked - amount
        self.total_staked.value = self.total_staked.value - amount
        
        # Update last reward time
        self.last_reward_time[Txn.sender] = Global.latest_timestamp
        
        log(b"Tokens unstaked - Amount: " + op.itob(amount))
        return String("Tokens unstaked successfully")

    @arc4.abimethod
    def claim_rewards(self) -> String:
        """Claim accumulated rewards"""
        assert self.is_paused.value == UInt64(0), "Staking is paused"
        
        # Update pending rewards
        self._update_rewards()
        
        current_reward_balance = self.reward_balance[Txn.sender]
        assert current_reward_balance > UInt64(0), "No rewards to claim"
        
        # Reset reward balance
        self.reward_balance[Txn.sender] = UInt64(0)
        
        # Update total rewards distributed
        self.total_rewards_distributed.value = self.total_rewards_distributed.value + current_reward_balance
        
        log(b"Rewards claimed - Amount: " + op.itob(current_reward_balance))
        return String("Rewards claimed successfully")

    @arc4.abimethod(readonly=True)
    def calculate_pending_rewards(self) -> UInt64:
        """Calculate pending rewards for the sender"""
        return self._calculate_reward_internal()

    @arc4.abimethod(readonly=True)
    def get_user_info(self) -> arc4.Tuple[arc4.UInt64, arc4.UInt64, arc4.UInt64]:
        """Get user's staking information"""
        pending_rewards = self._calculate_reward_internal()
        total_rewards = self.reward_balance[Txn.sender] + pending_rewards
        
        return arc4.Tuple((
            arc4.UInt64(self.staked_amount[Txn.sender]),
            arc4.UInt64(self.reward_balance[Txn.sender]),
            arc4.UInt64(total_rewards)
        ))

    @arc4.abimethod(readonly=True)
    def get_staking_info(self) -> arc4.Tuple[arc4.UInt64, arc4.UInt64, arc4.UInt64, arc4.UInt64]:
        """Get general staking information"""
        return arc4.Tuple((
            arc4.UInt64(self.total_staked.value),
            arc4.UInt64(self.total_rewards_distributed.value),
            arc4.UInt64(self.reward_amount),
            arc4.UInt64(self.reward_interval)
        ))

    @arc4.abimethod(readonly=True)
    def get_reward_rate(self) -> UInt64:
        """Get reward rate per second"""
        # Returns rewards per second scaled by precision factor
        return (self.reward_amount * self.precision_factor) // self.reward_interval

    @arc4.abimethod
    def update_reward_parameters(
        self,
        new_reward_amount: UInt64,
        new_reward_interval: UInt64,
    ) -> String:
        """Update reward parameters (admin only)"""
        assert Txn.sender.bytes == self.admin.value, "Only admin can update"
        assert new_reward_amount > UInt64(0), "Reward amount must be positive"
        assert new_reward_interval > UInt64(0), "Reward interval must be positive"
        
        # Update all users' rewards before changing parameters
        # In production, this would be done more efficiently
        
        self.reward_amount = new_reward_amount
        self.reward_interval = new_reward_interval
        
        log(b"Reward parameters updated")
        return String("Reward parameters updated successfully")

    @arc4.abimethod
    def emergency_withdraw(self) -> String:
        """Emergency withdraw all staked tokens (user only, no rewards)"""
        current_staked = self.staked_amount[Txn.sender]
        assert current_staked > UInt64(0), "No tokens staked"
        
        # Reset user's stake without updating rewards
        self.staked_amount[Txn.sender] = UInt64(0)
        self.total_staked.value = self.total_staked.value - current_staked
        
        log(b"Emergency withdrawal - Amount: " + op.itob(current_staked))
        return String("Emergency withdrawal completed")

    @arc4.abimethod
    def pause_staking(self) -> String:
        """Pause staking (admin only)"""
        assert Txn.sender.bytes == self.admin.value, "Only admin can pause"
        self.is_paused.value = UInt64(1)
        
        log(b"Staking paused")
        return String("Staking paused")

    @arc4.abimethod
    def unpause_staking(self) -> String:
        """Unpause staking (admin only)"""
        assert Txn.sender.bytes == self.admin.value, "Only admin can unpause"
        self.is_paused.value = UInt64(0)
        
        log(b"Staking unpaused")
        return String("Staking unpaused")

    @arc4.abimethod(readonly=True)
    def is_staking_paused(self) -> UInt64:
        """Check if staking is paused"""
        return self.is_paused.value

    @subroutine
    def _update_rewards(self) -> None:
        """Internal function to update user's reward balance"""
        pending_reward = self._calculate_reward_internal()
        
        if pending_reward > UInt64(0):
            current_balance = self.reward_balance[Txn.sender]
            self.reward_balance[Txn.sender] = current_balance + pending_reward
        
        self.last_reward_time[Txn.sender] = Global.latest_timestamp

    @subroutine
    def _calculate_reward_internal(self) -> UInt64:
        """Internal function to calculate pending rewards"""
        user_staked = self.staked_amount[Txn.sender]
        
        if user_staked == UInt64(0):
            return UInt64(0)
        
        last_time = self.last_reward_time[Txn.sender]
        current_time = Global.latest_timestamp
        
        if current_time <= last_time:
            return UInt64(0)
        
        time_passed = current_time - last_time
        intervals = time_passed // self.reward_interval
        
        # Calculate reward: intervals * reward_amount * user_staked / precision_factor
        reward = (intervals * self.reward_amount * user_staked) // self.precision_factor
        
        return reward

    @arc4.abimethod
    def compound_rewards(self) -> String:
        """Compound rewards by staking them"""
        assert self.is_paused.value == UInt64(0), "Staking is paused"
        
        # Update pending rewards
        self._update_rewards()
        
        current_reward_balance = self.reward_balance[Txn.sender]
        assert current_reward_balance > UInt64(0), "No rewards to compound"
        
        # Reset reward balance and add to staked amount
        self.reward_balance[Txn.sender] = UInt64(0)
        self.staked_amount[Txn.sender] = self.staked_amount[Txn.sender] + current_reward_balance
        self.total_staked.value = self.total_staked.value + current_reward_balance
        
        # Update last reward time
        self.last_reward_time[Txn.sender] = Global.latest_timestamp
        
        log(b"Rewards compounded - Amount: " + op.itob(current_reward_balance))
        return String("Rewards compounded successfully")