import { ethers } from "ethers";
import { AcalaJsonRpcProvider } from "@acala-network/eth-providers";
import { ACCOUNT, PROXYCONTRACT, ACA, DOT, LDOT, SA_DOT, LCDOT_13, HOMA, STABLE_ASSET, ALICE, ALICE_ETH, LIQUID_CROWDLOAN } from "../utils/config";
import UpgradeableStakingLSDABI from '../UpgradeableStakingLSD.json'
import { expect } from 'chai'
import { IStakingCall } from '../call/IStakingCall'
import { ILiquidCrowdloanCall } from '../call/ILiquidCrowdloanCall'
import { IHomaCall } from "../call/IHomaCall";
import { ConvertType } from "../utils/type";

(async () => {
    const provider = new AcalaJsonRpcProvider(
        "https://crosschain-dev.polkawallet.io:9909"
    );
    const AliceSigner = new ethers.Wallet(ALICE_ETH as string, provider)
    const iStakingCall = new IStakingCall(AliceSigner)

    console.log("owner", await iStakingCall.owner())
    const poolId = 14
    const amount = '1000000000000'
    // console.log(await iStakingCall.convertInfos(poolId))
    // const block = 421277//await provider.getBlockNumber()//"latest"
    // console.log("当前区块高度为：", block);
    
    // const tx = await iStakingCall.unstake(poolId, amount)// await iStakingCall.convertLSDPool(poolId, ConvertType.DOT2LDOT) // await iStakingCall.stake(poolId, amount)//await iStakingCall.addPool(DOT)
    // await tx.wait()
    // console.log(tx);
    
    const shareType = await iStakingCall.shareTypes(poolId);
    const convertInfo = await iStakingCall.convertInfos(poolId)
    const iLiquidCrowdloan = new ILiquidCrowdloanCall(AliceSigner)
    console.log("getRedeemCurrency", await iLiquidCrowdloan.getRedeemCurrency())
    const shares = await iStakingCall.shares(poolId, AliceSigner.address)
    const rewards = await iStakingCall.rewards(poolId, AliceSigner.address, ACA as string)
    const rewardTypes = await iStakingCall.rewardTypes(poolId);
    // const rewardsDeductionRates = await iStakingCall.rewardsDeductionRates(poolId, block);
    const totalShares = await iStakingCall.totalShares(poolId);

    // // const tx = await (await iStakingCall.notifyRewardRule(poolId, ACA as string, '100000000000000', 10000)).wait()
    // // console.log(tx.blockHash);

    // // const tx = await (await iStakingCall.setRewardsDeductionRate(poolId, "50000000000000000")).wait()
    // // console.log(tx.blockHash);

    // // const tx = await (await iStakingCall.claimRewards(poolId)).wait()
    // // console.log(`tx blockNumber: ${tx.blockNumber}, tx blockHash: ${tx.blockHash}, tx timestamp: ${tx.timestamp}`);

    // const rewardRules = await iStakingCall.rewardRules(poolId, ACA as string, block)
    // console.log((await provider.getBlock(421277)))
    // console.log("rewardRate", rewardRules.rewardRate.toString());
    // console.log("endTime", rewardRules.endTime.toString());
    // console.log("rewardRateAccumulated", rewardRules.rewardRateAccumulated.toString());
    // console.log("lastAccumulatedTime", rewardRules.lastAccumulatedTime.toString());
    // console.log("paidAccumulatedRates", (await iStakingCall.paidAccumulatedRates(poolId, AliceSigner.address, ACA as string, block)).toString())
    // console.log("earn", (await iStakingCall.earned(poolId, AliceSigner.address, ACA as string, block)).toString())
    // console.log("rewardPerShare", (await iStakingCall.rewardPerShare(poolId, ACA as string, block)).toString())
    // console.log("lastTimeRewardApplicable", (await iStakingCall.lastTimeRewardApplicable(poolId, ACA as string), block).toString())
    // console.log("rewardsDeductionRates", rewardsDeductionRates.toString());
    

    console.log("=============================================================");
    console.log("PoolIndex", (await iStakingCall.PoolIndex()).toString())
    console.log(`Pool#${poolId}`);
    console.log('shareTypes: ', shareType);
    console.log('shares', shares.toString())
    console.log('rewards', rewards);
    console.log('totalShares: ', totalShares.toString());
    console.log('convert token: ', convertInfo.convertedShareType);
    console.log('convert exchange rate: ', convertInfo.convertedExchangeRate.toString());
    console.log('rewardTypes: ', rewardTypes);
    // console.log('rewardsDeductionRates: ', rewardsDeductionRates.toString());
    console.log("=============================================================");
    
    // const acaContract = new ethers.Contract(ACA as string, erc20ABI, AliceSigner)
    // const acaCall = new IERC20Call(acaContract)
    // console.log((await acaCall.balanceOf(AliceSigner.address, 421176)).toString())
    // console.log((await acaCall.balanceOf(AliceSigner.address, 421277)).toString())
    // console.log((await acaCall.balanceOf(AliceSigner.address, 421278)).toString())

    const iHomaCall = new IHomaCall(AliceSigner)
    console.log("CommissionRate", (await iHomaCall.getCommissionRate()).toString())
    console.log("EstimatedRewardRate", (await iHomaCall.getEstimatedRewardRate()).toString())
    console.log("ExchangeRate", (await iHomaCall.getExchangeRate()).toString())
    console.log("MatchFee", (await iHomaCall.getFastMatchFee()).toString())


    console.log('completed')
})()