import { ethers } from "ethers";
import { AcalaJsonRpcProvider } from "@acala-network/eth-providers";
import { ACCOUNT, PROXYCONTRACT, ACA, DOT, LDOT, SA_DOT, LCDOT_13, HOMA, STABLE_ASSET, WTDOT, ALICE, ALICE_ETH, TEST_ACCOUNT, LIQUID_CROWDLOAN, MAX_UINT_AMOUNT } from "../utils/config";
import UpgradeableStakingLSDABI from '../UpgradeableStakingLSD.json'
import { expect, use } from 'chai'
import { IStakingCall } from '../call/IStakingCall'
import { ILiquidCrowdloanCall } from '../call/ILiquidCrowdloanCall'
import { IHomaCall } from "../call/IHomaCall";
import { IWrappedTDOTCall } from "../call/IWrappedTDOT";
import { BlockNumber, ConvertType, Operation, UserAddress } from "../utils/type";
import { IERC20Call, erc20ABI } from "../call/IERC20Call";
import { solidity } from "ethereum-waffle";
import { formatUnits } from "ethers/lib/utils";

use(solidity);

(async () => {
    const provider = new AcalaJsonRpcProvider(
        "https://crosschain-dev.polkawallet.io:9909"
    );
    const AliceSigner = new ethers.Wallet(ALICE_ETH as string, provider)
    const TestAccountSinger = new ethers.Wallet(TEST_ACCOUNT as string, provider)
    const iStakingCall = new IStakingCall(AliceSigner)
    const iACACall = new IERC20Call(ACA as string, AliceSigner)
    const iDOTCall = new IERC20Call(DOT as string, AliceSigner)
    const iLDOTCall = new IERC20Call(LDOT as string, AliceSigner)
    const iSADOTCall = new IERC20Call(SA_DOT as string, AliceSigner)
    const iLCDOTCall = new IERC20Call(LCDOT_13 as string, AliceSigner)
    const iWTDOTCall = new IERC20Call(WTDOT as string, AliceSigner)
    const iWrappedTDOTCall = new IWrappedTDOTCall(AliceSigner)
    const iLiquidCrowdloanCall = new ILiquidCrowdloanCall(AliceSigner)

    console.log("owner", await iStakingCall.owner())
    // console.log(iStakingCall.unstakeEncode(18, '1000000000001'));
    // console.log(await iStakingCall.pausedPoolOperations(18, Operation.Unstake))
    
    const poolId = 64 //Number((await iStakingCall.PoolIndex()).toString()) - 1
    const amount = '100000000000'

    const getAllBalanceInfo = async (who: UserAddress, blockTag: BlockNumber = "latest") => {
        console.log("------------start getAllBalanceInfo------------");
        
        const [
            acaBalance,
            acaDecimal,
            dotBalance, 
            dotDecimal,
            ldotBalance,
            ldotDecimal,
            tdotBalance,
            tdotDecimal,
            lcdotBalance,
            lcdotDecimal, 
            wtdotBalance,
            wtdotDecimal
        ] = await Promise.all([
            iACACall.balanceOf(who, blockTag),
            iACACall.decimals(),
            iDOTCall.balanceOf(who, blockTag),
            iDOTCall.decimals(),
            iLDOTCall.balanceOf(who, blockTag),
            iLDOTCall.decimals(),
            iSADOTCall.balanceOf(who, blockTag), 
            iSADOTCall.decimals(),
            iLCDOTCall.balanceOf(who, blockTag),
            iLCDOTCall.decimals(),
            iWTDOTCall.balanceOf(who, blockTag),
            iWTDOTCall.decimals()
        ])
        const result = {
            'ACA': {
              token: 'ACA',
              balance: acaBalance.toString(),
              formatBalance: formatUnits(acaBalance, acaDecimal),
              decimal: acaDecimal
            },
            'DOT': {
              token: 'DOT',
              balance: dotBalance.toString(),
              formatBalance: formatUnits(dotBalance, dotDecimal),
              decimal: dotDecimal
            },
            'LDOT': {
              token: 'LDOT', 
              balance: ldotBalance.toString(),
              formatBalance: formatUnits(ldotBalance, ldotDecimal),
              decimal: ldotDecimal
            },
            'TDOT': {
              token: 'TDOT',
              balance: tdotBalance.toString(),
              formatBalance: formatUnits(tdotBalance, tdotDecimal),
              decimal: tdotDecimal
            },
            'LCDOT': {
              token: 'LCDOT',
              balance: lcdotBalance.toString(), 
              formatBalance: formatUnits(lcdotBalance, lcdotDecimal),
              decimal: lcdotDecimal
            },
            'WTDOT': {
              token: 'WTDOT',
              balance: wtdotBalance.toString(),
              formatBalance: formatUnits(wtdotBalance, wtdotDecimal),
              decimal: wtdotDecimal
            }
        }
        console.table(result)

        return result
    }

    const getAllRewardsInfo = async (poolIndex: number, blockTag: BlockNumber = "latest") => {
        console.log("------------start getAllRewardsInfo------------");
        const rewardTypes = await iStakingCall.rewardTypes(poolIndex, blockTag)
        let result = []
        for (const type of rewardTypes) {
            const { rewardRate, endTime, rewardRateAccumulated, lastAccumulatedTime } = await iStakingCall.rewardRules(poolId, type)
            const rewardPerShare = await iStakingCall.rewardPerShare(poolIndex, type, blockTag)
            const rewardInfo = {
                poolIndex,
                rewardType: type,
                rewardRate: rewardRate.toString(),
                endTime: endTime.toString(),
                rewardRateAccumulated: rewardRateAccumulated.toString(),
                lastAccumulatedTime: lastAccumulatedTime.toString(),
                rewardPerShare: rewardPerShare.toString()
            }
            result.push(rewardInfo)
            console.table(rewardInfo)
        }
        return result
    }

    const getPoolInfo = async (poolIndex: number, blockTag: BlockNumber = "latest") => {
        console.log("------------start getPoolInfo------------");
        const shareTypes = await iStakingCall.shareTypes(poolIndex)
        const [
            convertInfos, 
            rewardsDeductionRates, 
            lastTimeRewardApplicable, 
            totalShares, 
            pausedPoolStake, 
            pausedPoolUnstake, 
            pausedPoolClaimRewards
        ] = await Promise.all([
            iStakingCall.convertInfos(poolIndex, blockTag),
            iStakingCall.rewardsDeductionRates(poolIndex, blockTag),
            iStakingCall.lastTimeRewardApplicable(poolIndex, shareTypes, blockTag),
            iStakingCall.totalShares(poolIndex, blockTag),
            iStakingCall.shareTypes,
            iStakingCall.pausedPoolOperations(poolIndex, Operation.Stake, blockTag),
            iStakingCall.pausedPoolOperations(poolIndex, Operation.Unstake, blockTag),
            iStakingCall.pausedPoolOperations(poolIndex, Operation.ClaimRewards, blockTag),
        ])
        const result = {
            poolIndex,
            shareTypes,
            totalShares: totalShares.toString(),
            convertedShareType: convertInfos.convertedShareType,
            convertedExchangeRate: convertInfos.convertedExchangeRate.toString(),
            rewardsDeductionRates: rewardsDeductionRates.toString(),
            lastTimeRewardApplicable: lastTimeRewardApplicable.toString(),
            pausedPoolStake, 
            pausedPoolUnstake, 
            pausedPoolClaimRewards
        }
        console.table(result)
        return result
    }

    const getUserPoolInfo = async (poolIndex: number, who: UserAddress, blockTag: BlockNumber = "latest") => {
        console.log("------------start getUserInfo------------");
        const shares = await iStakingCall.shares(poolIndex, who, blockTag)

        let result = []
        const rewardTypes = await iStakingCall.rewardTypes(poolIndex, blockTag)
        for (const type of rewardTypes) {
            const [
                paidAccumulatedRates,
                earned,
                rewards
            ] = await Promise.all([
                iStakingCall.paidAccumulatedRates(poolIndex, who, type, blockTag),
                iStakingCall.earned(poolIndex, who, type, blockTag),
                iStakingCall.rewards(poolIndex, who, type, blockTag)
            ])
            result.push({
                poolIndex,
                shares: shares.toString(),
                rewardType: type,
                paidAccumulatedRates: paidAccumulatedRates.toString(),
                earned: earned.toString(),
                rewards: rewards.toString()
            })
        }
        console.table(result)
        return result
    }

    const getPoolConfig = async (poolIndex: number, blockTag: BlockNumber = "latest") => {
        console.log("------------start getPoolConfig------------");
        const [
            owner,
            HOMA,
            DOT,
            LDOT,
            LCDOT,
            TDOT,
            LIQUID_CROWDLOAN,
            STABLE_ASSET,
            MAX_REWARD_TYPES,
            paused
        ] = await Promise.all([
            iStakingCall.owner(blockTag),
            iStakingCall.HOMA(),
            iStakingCall.DOT(),
            iStakingCall.LDOT(),
            iStakingCall.LCDOT(),
            iStakingCall.TDOT(),
            iStakingCall.LIQUID_CROWDLOAN(),
            iStakingCall.STABLE_ASSET(),
            iStakingCall.MAX_REWARD_TYPES(),
            iStakingCall.paused(blockTag),
        ])

        const result = {
            poolIndex,
            owner,
            HOMA,
            DOT,
            LDOT,
            LCDOT,
            TDOT,
            LIQUID_CROWDLOAN,
            STABLE_ASSET,
            MAX_REWARD_TYPES: MAX_REWARD_TYPES.toString(),
            paused
        }

        console.table(result)
        return result
    }

    const getBlockByTxHash = async (txHash: string) => {
        const { blockNumber } = await provider.getTransaction(txHash) as { blockNumber : number }
        const block = await provider.getBlock(blockNumber)
        console.log(block);
        
        return block
    }

    await getAllBalanceInfo(AliceSigner.address)
    await getAllRewardsInfo(poolId)
    await getPoolInfo(poolId)
    await getPoolConfig(poolId)
    await getUserPoolInfo(poolId, AliceSigner.address)

    await getBlockByTxHash("0x16bb3be3b89f7eb4e7607fda8d24135fe494aa5b7f150c1bb4956601c900e943")
    // const shareType = await iStakingCall.shareTypes(poolId);
    // // const iLiquidCrowdloan = new ILiquidCrowdloanCall(AliceSigner)
    // // console.log("getRedeemCurrency", await iLiquidCrowdloan.getRedeemCurrency(block))
    // // const rewards = await iStakingCall.rewards(poolId, AliceSigner.address, DOT as string, block)

    // console.log("PoolIndex", (await iStakingCall.PoolIndex()).toString())

    // const iHomaCall = new IHomaCall(AliceSigner)
    // console.log("CommissionRate", (await iHomaCall.getCommissionRate(block)).toString())
    // console.log("EstimatedRewardRate", (await iHomaCall.getEstimatedRewardRate(block)).toString())
    // console.log("ExchangeRate", (await iHomaCall.getExchangeRate(block)).toString())
    // console.log("MatchFee", (await iHomaCall.getFastMatchFee(block)).toString())


    console.log('completed')
})()