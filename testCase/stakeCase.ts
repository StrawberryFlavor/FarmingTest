import { IStakingCall } from '../call/IStakingCall'
import { Keyring } from '@polkadot/api';
import { Suite } from "../suite";
import { ACCOUNT, PROXYCONTRACT, ACA, DOT, LDOT, SA_DOT, LCDOT_13, HOMA, STABLE_ASSET, ALICE, LIQUID_CROWDLOAN } from "../utils/config";
import { AcalaJsonRpcProvider } from '@acala-network/eth-providers';

(async () => {
    const suite = new Suite();
    let mandalaWSS = "wss://mandala-tc9-rpc.aca-staging.network"
    await suite.connect(mandalaWSS);
    const provider = new AcalaJsonRpcProvider(
        "https://crosschain-dev.polkawallet.io:9909"
    );
    const iStakingCall = new IStakingCall(provider)
    let testAccount = (new Keyring({type: 'sr25519'})).addFromMnemonic(ACCOUNT as any)
    let testAddress = testAccount.address

    function callEVM(contractAddress: string, callData:string) {
        return suite.api.tx.evm.call(
            contractAddress,
            callData,
            0,
            1100004,
            111500,
            []
        )
    }

    async function callApprove(token: string, amount: string, account: any) {
        const callData = iStakingCall.approveEncode(amount)
        await suite.send(account, callEVM(token, callData))
    }

    async function callStake(poolId: number, amount: string, account:any) {
        const callData = iStakingCall.stakeEncode(poolId, amount)
        await suite.send(account, callEVM(PROXYCONTRACT as any, callData))

    }

    async function callAddPool(token: string, account: any){
        const callData = iStakingCall.addPoolEncode(token)
        await suite.send(account, callEVM(PROXYCONTRACT as any, callData))
    }

    console.log(await iStakingCall.owner())
    const amount = '1000000000000'
    await callApprove(LCDOT_13 as any, amount, testAccount)
    console.log('=== approve completed ===')
// // await callAddPool(DOT)
    // await callStake(0, amount, testAccount)
    // console.log('=== stake completed ===')

    console.log('completed')
    await suite.disconnect()
//     process.exit(0)
})()