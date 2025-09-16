from algokit_utils.network_clients import get_algod_client
from algokit_utils.account import get_account
from algosdk.v2client.algod import AlgodClient
from algosdk import transaction
from pathlib import Path
import json
import base64

def deploy() -> None:
    """Deploy the PT Token contract"""
    # Get network client
    algod_client = get_algod_client()
    
    # Get deployer account from environment
    deployer = get_account(algod_client, "DEPLOYER")
    
    # Get the TEAL programs
    artifacts_path = Path(__file__).parent / ".." / "artifacts" / "pt_token"
    
    # Read approval program
    with open(artifacts_path / "PTToken.approval.teal", 'r') as f:
        approval_teal = f.read()
    
    # Read clear program  
    with open(artifacts_path / "PTToken.clear.teal", 'r') as f:
        clear_teal = f.read()
    
    # Compile programs
    approval_result = algod_client.compile(approval_teal)
    approval_program = base64.b64decode(approval_result['result'])
    
    clear_result = algod_client.compile(clear_teal)
    clear_program = base64.b64decode(clear_result['result'])
    
    # Get suggested parameters
    params = algod_client.suggested_params()
    
    # Create application transaction
    txn = transaction.ApplicationCreateTxn(
        sender=deployer.address,
        sp=params,
        on_complete=transaction.OnComplete.NoOpOC,
        approval_program=approval_program,
        clear_program=clear_program,
        global_schema=transaction.StateSchema(num_uints=8, num_byte_slices=8),
        local_schema=transaction.StateSchema(num_uints=8, num_byte_slices=8)
    )
    
    # Sign and send transaction
    signed_txn = txn.sign(deployer.private_key)
    tx_id = algod_client.send_transaction(signed_txn)
    
    # Wait for confirmation
    result = transaction.wait_for_confirmation(algod_client, tx_id, 4)
    app_id = result['application-index']
    
    print(f"PT Token contract deployed successfully! App ID: {app_id}")
    print(f"Transaction ID: {tx_id}")


