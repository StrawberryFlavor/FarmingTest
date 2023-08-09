import { ethers } from "ethers";
import { AcalaJsonRpcProvider } from "@acala-network/eth-providers";
import { ACCOUNT, PROXYCONTRACT, ACA, DOT, LDOT, SA_DOT, LCDOT_13, HOMA, STABLE_ASSET, ALICE, ALICE_ETH, LIQUID_CROWDLOAN } from "../utils/config";
import UpgradeableStakingLSDABI from '../UpgradeableStakingLSD.json'
import { expect } from 'chai'

(async () => {
    const provider = new AcalaJsonRpcProvider(
        "https://crosschain-dev.polkawallet.io:9909"
    );
    const AliceSigner = new ethers.Wallet(ALICE_ETH as string, provider)
    const ProxyContract = new ethers.Contract(
        PROXYCONTRACT as string,
        UpgradeableStakingLSDABI,
        AliceSigner
    );

    console.log("owner", await ProxyContract.owner())
    const poolId = 0
    const amount = '1000000000000'

    const shareType = await ProxyContract.shareTypes(poolId);
    const convertInfo = await ProxyContract.convertInfos(poolId);
    const rewardTypes = await ProxyContract.rewardTypes(poolId);
    const rewardsDeductionRates = await ProxyContract.rewardsDeductionRates(poolId);
    const totalShares = await ProxyContract.totalShares(poolId);

    console.log("=============================================================");
    console.log(`Pool#${poolId}`);
    console.log('shareTypes: ', shareType);
    console.log('totalShares: ', totalShares.toString());
    console.log('convert token: ', convertInfo.convertedShareType);
    console.log('convert exchange rate: ', convertInfo.convertedExchangeRate);
    console.log('rewardTypes: ', rewardTypes);
    console.log('rewardsDeductionRates: ', rewardsDeductionRates.toString());
    console.log("=============================================================");

    const shareBeforeStake = await ProxyContract.shares(poolId, AliceSigner.address)
    const stakeTx = await (await ProxyContract.stake(poolId, amount)).wait(1)
    console.log('stakeTx', stakeTx.blockHash);
    
    const shareAfterStake = await ProxyContract.shares(poolId, AliceSigner.address)
    console.log('=== stake completed ===')
    // expect(shareBeforeStake.eq(shareAfterStake.sub(amount))).to.be.true

    const unstakeTx = await (await ProxyContract.unstake(poolId, amount)).wait(1)
    console.log('unstakeTx', unstakeTx.blockHash);

    const shareAfterUnstake = await ProxyContract.shares(poolId, AliceSigner.address)
    console.log('=== unstake completed ===')

    console.log(shareBeforeStake.toString(), shareAfterStake.toString(), shareAfterUnstake.toString());
    
    // expect(shareBeforeStake.eq(shareAfterUnstake)).to.be.true

    console.log('completed')
})()