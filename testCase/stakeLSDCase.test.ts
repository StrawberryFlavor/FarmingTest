import {expect, use} from 'chai';
import { BigNumber, ethers } from "ethers";
import { AcalaJsonRpcProvider } from "@acala-network/eth-providers";
import {solidity} from 'ethereum-waffle';
import { IStakingCall } from '../call/IStakingCall'
import { ACCOUNT, PROXYCONTRACT, ACA, DOT, LDOT, SA_DOT, LCDOT_13, HOMA, STABLE_ASSET, ALICE, ALICE_ETH, TEST_ACCOUNT, LIQUID_CROWDLOAN, BLACK_HOLE, MAX_UINT_AMOUNT, WTDOT, AVERAGE_BLOCK_TIME } from "../utils/config";
import { Amount, ContractAddress, ConvertType, Operation, UserAddress, getConversion } from '../utils/type';
import { IERC20Call } from '../call/IERC20Call';
import { AlreadyConverted, AlreadyPaused, BalanceLow, CannotStake0, CannotUnstakeZero, InsufficientAllowance, NotPaused, OperationPaused, PoolIsEmpty, PoolMustExist, PoolNotExist, RewardDurationZero, RewardTokenZero, ShareNotEnough, ShareTokenMustDOT, ShareTokenMustLcDOT, TooManyRewardType, WrongRate, notOwner } from '../utils/error';
import { expectRevert } from '../utils/expectRevert';
import { ILiquidCrowdloanCall } from '../call/ILiquidCrowdloanCall';
import { IWrappedTDOTCall } from '../call/IWrappedTDOT';

use(solidity);

describe('staking 合约测试', () => {
    const provider = new AcalaJsonRpcProvider(
        "https://crosschain-dev.polkawallet.io:9909"
    );
    const AliceSigner = new ethers.Wallet(ALICE_ETH as string, provider)
    const TestASinger = new ethers.Wallet(TEST_ACCOUNT as string, provider)
    const AliceStakingCall = new IStakingCall(AliceSigner)
    const TestAStakingCall = new IStakingCall(TestASinger)
    const ACACall = new IERC20Call(ACA as string, AliceSigner)
    const DOTCall = new IERC20Call(DOT as string, AliceSigner)
    const LDOTCall = new IERC20Call(LDOT as string, AliceSigner)
    const SADOTCall = new IERC20Call(SA_DOT as string, AliceSigner)
    const LCDOTCall = new IERC20Call(LCDOT_13 as string, AliceSigner)
    const WTDOTCall = new IERC20Call(WTDOT as string, AliceSigner)
    const iWrappedTDOTCall = new IWrappedTDOTCall(AliceSigner)
    const iLiquidCrowdloanCall = new ILiquidCrowdloanCall(AliceSigner)
    const amount = BigNumber.from("100000000000")

    // before(async () => {
    //     // const [aca, dot, sadot, lcdot] = await Promise.all([
    //     //     ACACall.allowance(PROXYCONTRACT as string, AliceSigner.address),
    //     //     DOTCall.allowance(PROXYCONTRACT as string, AliceSigner.address),
    //     //     SADOTCall.allowance(PROXYCONTRACT as string, AliceSigner.address),
    //     //     LCDOTCall.allowance(PROXYCONTRACT as string, AliceSigner.address),
    //     // ])

    //     await ACACall.approve(PROXYCONTRACT as string, MAX_UINT_AMOUNT)
    //     // await DOTCall.approve(PROXYCONTRACT as string, MAX_UINT_AMOUNT)
    //     await SADOTCall.approve(PROXYCONTRACT as string, MAX_UINT_AMOUNT)
    //     await LCDOTCall.approve(PROXYCONTRACT as string, MAX_UINT_AMOUNT)
    // })

    describe.skip("鉴权测试", () => {
        let poolId = 19
        before("首先转让权限", async () => {
            const owner = await AliceStakingCall.owner()
            if(owner == AliceSigner.address) {
                const tx = await AliceStakingCall.transferOwnership(TestASinger.address)
                await tx.wait()
            }
            expect(await TestAStakingCall.owner()).equal(TestASinger.address)
        })

        after("将权限归还Alice", async () => {
            // transferOwnership 将权限还给 Alice
            await TestAStakingCall.transferOwnership(AliceSigner.address)
            expect(await AliceStakingCall.owner()).equal(AliceSigner.address)
        })

        it.skip("非owner 调用transferOwnership 转让所有权 => should reverted", async () => {
            await expectRevert(TestAStakingCall.transferOwnership(AliceSigner.address), notOwner)
        })

        it("owner 调用 transferOwnership 转让所有权限后 original owner应该失去权限 => should reverted", async () => {
            // original owner 调用 owner 权限方法应该失败
            await expectRevert(AliceStakingCall.transferOwnership(AliceSigner.address), notOwner)
            await expectRevert(AliceStakingCall.addPool(DOT as string), notOwner)
            await expectRevert(AliceStakingCall.updateRewardRule(0, DOT as string, amount, 1), notOwner)
            await expectRevert(AliceStakingCall.pause(), notOwner)
            await expectRevert(AliceStakingCall.unpause(), notOwner)
            await expectRevert(AliceStakingCall.setPoolOperationPause(0, Operation.Stake, true), notOwner)
            await expectRevert(AliceStakingCall.setPoolOperationPause(0, Operation.Unstake, true), notOwner)
            await expectRevert(AliceStakingCall.setPoolOperationPause(0, Operation.ClaimRewards, true), notOwner)
        })

        it("owner 调用 transferOwnership 转让所有权限后 new owner 应该拥有 pause 权限", async () => {
            await TestAStakingCall.pause()
            expect(await TestAStakingCall.paused()).to.be.true
        })

        it.skip("owner 调用 transferOwnership 转让所有权限后 new owner 应该拥有 unpause 权限", async () => {
            await TestAStakingCall.unpause()
            expect(await TestAStakingCall.paused()).to.be.false
        })

        it("owner 调用 transferOwnership 转让所有权限后 new owner 应该拥有 setPoolOperationPause 权限", async () => {
            // setPoolOperationPause stake
            await TestAStakingCall.setPoolOperationPause(poolId, Operation.Stake, true)
            expect(await TestAStakingCall.pausedPoolOperations(poolId, Operation.Stake)).to.be.true
            await TestAStakingCall.setPoolOperationPause(poolId, Operation.Stake, false)
            expect(await TestAStakingCall.pausedPoolOperations(poolId, Operation.Stake)).to.be.false

            // // setPoolOperationPause unstake
            // await TestAStakingCall.setPoolOperationPause(poolId, Operation.Unstake, true)
            // await TestAStakingCall.setPoolOperationPause(poolId, Operation.Unstake, false)

            // // setPoolOperationPause ClaimRewards
            // await TestAStakingCall.setPoolOperationPause(poolId, Operation.ClaimRewards, true)
            // await TestAStakingCall.setPoolOperationPause(poolId, Operation.ClaimRewards, false)
        })
    })

    describe("合约方法测试", () => {
        let poolId = 58
        let shareToken = DOT as string
        const nonShareTOken = LDOT as string
        const rewardToken = DOT as string
        const _rewardRate = "10000000000"
        const passedEndTime = "1692590400"  // 2023-08-21 12:00:00

        // 检查stake后的资产变化
        const checkStake = async (txHash: string, poolIndex: number, shareType: ContractAddress, stakeAmount: Amount) => {
            const { blockNumber: stakeBlockNumber } = await provider.getTransaction(txHash) as { blockNumber : number }
            const { timestamp: stakeTime } = await provider.getBlock(stakeBlockNumber)
            // shareType的Call
            const fromErc20Call = new IERC20Call(shareType, AliceSigner)
            const { convertedShareType, convertedExchangeRate } = await AliceStakingCall.convertInfos(poolIndex, stakeBlockNumber - 1)
            // 如果 convertedShareType不为黑洞地址，证明池子已经被转化过了
            console.log(convertedShareType);
            
            if (convertedShareType != BLACK_HOLE) {
                const toErc20Call = new IERC20Call(convertedShareType, AliceSigner)

                let expectConvertedAmount = convertedExchangeRate.mul(stakeAmount).div("1000000000000000000")
                const [aliceFromBalanceBefore, stakingToBalanceBefore, sharesBefore, totalSharesBefore] = await Promise.all([
                    fromErc20Call.balanceOf(AliceSigner.address, stakeBlockNumber - 1),
                    toErc20Call.balanceOf(PROXYCONTRACT as string, stakeBlockNumber - 1),
                    AliceStakingCall.shares(poolIndex, AliceSigner.address, stakeBlockNumber - 1),
                    AliceStakingCall.totalShares(poolIndex, stakeBlockNumber - 1),
                ]);
                const [aliceFromBalanceAfter, stakingToBalanceAfter, sharesAfter, totalSharesAfter] = await Promise.all([
                    fromErc20Call.balanceOf(AliceSigner.address, stakeBlockNumber),
                    toErc20Call.balanceOf(PROXYCONTRACT as string, stakeBlockNumber),
                    AliceStakingCall.shares(poolIndex, AliceSigner.address, stakeBlockNumber),
                    AliceStakingCall.totalShares(poolIndex, stakeBlockNumber),
                ]);
                // 判断转化之后是不是WTDOT
                const isWTDOT = ethers.utils.getAddress(convertedShareType) == ethers.utils.getAddress(WTDOT as string)
                const isSADOT = ethers.utils.getAddress(convertedShareType) == ethers.utils.getAddress(SA_DOT as string)
                const isLDOT = ethers.utils.getAddress(convertedShareType) == ethers.utils.getAddress(LDOT as string)
                const isDOT = ethers.utils.getAddress(shareType) == ethers.utils.getAddress(DOT as string)
                const isLCDOT = ethers.utils.getAddress(shareType) == ethers.utils.getAddress(LCDOT_13 as string)
                // 如果shareToken是DOT 并且 转化为了WTDOT，需要将DOT先转成TDOT再转成WTDOT
                if ((isDOT || isLCDOT) && (isWTDOT || isSADOT)) {
                    // 查询tDOT mint了多少
                    const [tDOTTotalSupllyBefore, tDOTTotalSupllyAfter] = await Promise.all([
                        SADOTCall.totalSupply(stakeBlockNumber - 1),
                        SADOTCall.totalSupply(stakeBlockNumber)
                    ])
                    const tDOTDiff = tDOTTotalSupllyAfter.sub(tDOTTotalSupllyBefore)
                    const depositRate = await iWrappedTDOTCall.depositRate(stakeBlockNumber - 1)
                    expectConvertedAmount = tDOTDiff.mul(depositRate).div("1000000000000000000")
                    // const redeemCurrency = iLiquidCrowdloanCall.getRedeemCurrency(stakeBlockNumber - 1)
                } else if (isLDOT) {
                    // 查询LDOT mint了多少
                    const [lDOTTotalSupllyBefore, lDOTTotalSupllyAfter] = await Promise.all([
                        LDOTCall.totalSupply(stakeBlockNumber - 1),
                        LDOTCall.totalSupply(stakeBlockNumber)
                    ])
                    expectConvertedAmount = lDOTTotalSupllyAfter.sub(lDOTTotalSupllyBefore)
                }
                let expectSharesAdd = expectConvertedAmount.mul("1000000000000000000").div(convertedExchangeRate);
                console.log("expectSharesAdd", expectSharesAdd.toString());
                
                // alice的shareType balance 应该减少 stakeAmount
                console.log(aliceFromBalanceBefore.toString(), aliceFromBalanceAfter.toString());
                
                expect(aliceFromBalanceBefore.eq(aliceFromBalanceAfter.add(stakeAmount))).true
                // 合约的convertedShareType balance 应该增加 convertedAmount
                console.log(stakingToBalanceBefore.toString(), stakingToBalanceAfter.toString());
                expect(stakingToBalanceBefore.eq(stakingToBalanceAfter.sub(expectConvertedAmount))).true
                // 用户的shares应该增加expectSharesAdd的
                console.log(sharesBefore.toString(), sharesAfter.toString());
                
                expect(sharesBefore.eq(sharesAfter.sub(expectSharesAdd))).true
                // 池子的totalShares应该增加expectSharesAdd的
                expect(totalSharesBefore.eq(totalSharesAfter.sub(expectSharesAdd))).true
            } else {
                const [
                    stakingBalanceBefore,
                    aliceBalanceBefore,
                    sharesBefore,
                    totalShareBefore
                ] = await Promise.all([
                    fromErc20Call.balanceOf(PROXYCONTRACT as string, stakeBlockNumber - 1),
                    fromErc20Call.balanceOf(AliceSigner.address, stakeBlockNumber - 1),
                    AliceStakingCall.shares(poolIndex, AliceSigner.address, stakeBlockNumber - 1),
                    AliceStakingCall.totalShares(poolIndex, stakeBlockNumber - 1)
                ])

                const [
                    stakingBalanceAfter,
                    aliceBalanceAfter,
                    sharesAfter,
                    totalShareAfter
                ] = await Promise.all([
                    fromErc20Call.balanceOf(PROXYCONTRACT as string, stakeBlockNumber),
                    fromErc20Call.balanceOf(AliceSigner.address, stakeBlockNumber),
                    AliceStakingCall.shares(poolIndex, AliceSigner.address, stakeBlockNumber),
                    AliceStakingCall.totalShares(poolIndex, stakeBlockNumber)
                ])
    
                expect(stakingBalanceBefore.eq(stakingBalanceAfter.sub(stakeAmount))).true
                expect(aliceBalanceBefore.eq(aliceBalanceAfter.add(stakeAmount))).true
                console.log(sharesBefore.toString(), sharesAfter.toString());
                
                expect(sharesBefore.eq(sharesAfter.sub(stakeAmount))).true
                expect(totalShareBefore.eq(totalShareAfter.sub(stakeAmount))).true
            }
        }

        const checkUnstake = async (txHash: string, poolIndex: number, shareType: ContractAddress, unstakeAmount: Amount) => {
            const { blockNumber: unstakeBlockNumber } = await provider.getTransaction(txHash) as { blockNumber : number }
            const { timestamp: unstakeTime } = await provider.getBlock(unstakeBlockNumber)

            const isShareTypeWTDOT = ethers.utils.getAddress(shareType) == ethers.utils.getAddress(WTDOT as string)
            const { convertedShareType, convertedExchangeRate } = await AliceStakingCall.convertInfos(poolIndex)
            const isConvertedWTDOT = ethers.utils.getAddress(convertedShareType) == ethers.utils.getAddress(WTDOT as string)
            const isConvertedTDOT = ethers.utils.getAddress(convertedShareType) == ethers.utils.getAddress(SA_DOT as string)


            // shareType的Call 如果shareType=WTDOT或者convertedShareType=WTDOT || TDOT 那么赎回的应该是TDOT
            let fromErc20Call: IERC20Call
            if (isConvertedWTDOT || isConvertedTDOT) {
                fromErc20Call = new IERC20Call(SA_DOT as string, AliceSigner)
            } else {
                fromErc20Call = new IERC20Call(shareType, AliceSigner)
            }
            // 如果 convertedShareType不为黑洞地址，证明池子已经被转化过了
            console.log(convertedShareType);
            
            if (convertedShareType != BLACK_HOLE) {
                const toErc20Call = new IERC20Call(convertedShareType, AliceSigner)
                const expectConvertedAmount = convertedExchangeRate.mul(unstakeAmount).div("1000000000000000000")
                let expectWithdrawAmount = expectConvertedAmount

                // 如果池子转化成了WTDOT 那么赎回的应该是TDOT 所以需要先转成TDOT
                if (isConvertedWTDOT) {
                    const withdrawRate = await iWrappedTDOTCall.withdrawRate(unstakeBlockNumber - 1)
                    expectWithdrawAmount = withdrawRate.mul(expectConvertedAmount).div("1000000000000000000")
                }

                const [aliceFromBalanceBefore, stakingToBalanceBefore, sharesBefore, totalSharesBefore] = await Promise.all([
                    fromErc20Call.balanceOf(AliceSigner.address, unstakeBlockNumber - 1),
                    toErc20Call.balanceOf(PROXYCONTRACT as string, unstakeBlockNumber - 1),
                    AliceStakingCall.shares(poolIndex, AliceSigner.address, unstakeBlockNumber - 1),
                    AliceStakingCall.totalShares(poolIndex, unstakeBlockNumber - 1),
                ]);

                const [aliceFromBalanceAfter, stakingToBalanceAfter, sharesAfter, totalSharesAfter] = await Promise.all([
                    fromErc20Call.balanceOf(AliceSigner.address, unstakeBlockNumber),
                    toErc20Call.balanceOf(PROXYCONTRACT as string, unstakeBlockNumber),
                    AliceStakingCall.shares(poolIndex, AliceSigner.address, unstakeBlockNumber),
                    AliceStakingCall.totalShares(poolIndex, unstakeBlockNumber),
                ]);
                console.log("expectConvertedAmount", expectConvertedAmount.toString());
                
                console.log(aliceFromBalanceBefore.toString(), aliceFromBalanceAfter.toString());
                // alice的shareType balance 应该增加 expectConvertedAmount
                expect(aliceFromBalanceBefore.eq(aliceFromBalanceAfter.sub(expectWithdrawAmount))).true
                // 合约的convertedShareType balance 应该减少 expectConvertedAmount
                expect(stakingToBalanceBefore.eq(stakingToBalanceAfter.add(expectConvertedAmount))).true
                // 用户的shares应该减少 unstakeAmount
                console.log(sharesBefore.toString(), sharesAfter.toString());
                expect(sharesBefore.eq(sharesAfter.add(unstakeAmount))).true
                // 池子的totalShares应该增加stakeAmount的
                expect(totalSharesBefore.eq(totalSharesAfter.add(unstakeAmount))).true
            } else {
                const [
                    stakingBalanceBefore,
                    aliceBalanceBefore,
                    sharesBefore,
                    totalShareBefore
                ] = await Promise.all([
                    fromErc20Call.balanceOf(PROXYCONTRACT as string, unstakeBlockNumber - 1),
                    fromErc20Call.balanceOf(AliceSigner.address, unstakeBlockNumber - 1),
                    AliceStakingCall.shares(poolIndex, AliceSigner.address, unstakeBlockNumber - 1),
                    AliceStakingCall.totalShares(poolIndex, unstakeBlockNumber - 1)
                ])

                const [
                    stakingBalanceAfter,
                    aliceBalanceAfter,
                    sharesAfter,
                    totalShareAfter
                ] = await Promise.all([
                    fromErc20Call.balanceOf(PROXYCONTRACT as string, unstakeBlockNumber),
                    fromErc20Call.balanceOf(AliceSigner.address, unstakeBlockNumber),
                    AliceStakingCall.shares(poolIndex, AliceSigner.address, unstakeBlockNumber),
                    AliceStakingCall.totalShares(poolIndex, unstakeBlockNumber)
                ])
    
                expect(stakingBalanceBefore.eq(stakingBalanceAfter.add(unstakeAmount))).true
                expect(aliceBalanceBefore.eq(aliceBalanceAfter.sub(unstakeAmount))).true
                expect(sharesBefore.eq(sharesAfter.add(unstakeAmount))).true
                expect(totalShareBefore.eq(totalShareAfter.add(unstakeAmount))).true
            }
        }

        // 检查claimRewards后的奖励和资产变化
        const checkReward = async (txHash: string, poolIndex: number, rewardType: ContractAddress) => {
            const claimBlockNumber = 526873// await provider.getTransaction(txHash) as { blockNumber : number }
            const { timestamp: claimTime } = await provider.getBlock(claimBlockNumber)
            const iERC20Call = new IERC20Call(rewardType, AliceSigner)

            const { 
                rewardRate: rewardRateBefore, 
                endTime: endTimeBefore, 
                rewardRateAccumulated: rewardRateAccumulatedBefore, 
                lastAccumulatedTime: lastAccumulatedTimeBefore 
            } = await AliceStakingCall.rewardRules(poolIndex, rewardType, claimBlockNumber-1)
            console.table({ 
                rewardRate: rewardRateBefore.toString(), 
                endTime: endTimeBefore.toString(), 
                rewardRateAccumulated: rewardRateAccumulatedBefore.toString(), 
                lastAccumulatedTime: lastAccumulatedTimeBefore.toString() 
            })
            const { 
                rewardRate: rewardRateAfter, 
                endTime: endTimeAfter, 
                rewardRateAccumulated: rewardRateAccumulatedAfter, 
                lastAccumulatedTime: lastAccumulatedTimeAfter 
            } = await AliceStakingCall.rewardRules(poolIndex, rewardType, claimBlockNumber)
            // rewardRate 不变
            expect(rewardRateBefore.eq(rewardRateAfter)).true
            // endTime 不变
            expect(endTimeBefore.eq(endTimeAfter)).true
            // lastAccumulatedTime 如果当前时间小于结束时间EndTime 那就更新为当前时间 否则为EndTime 
            const expectAccumulatedTime = endTimeBefore.gt(claimTime) ? BigNumber.from(claimTime) : endTimeBefore
            expect(lastAccumulatedTimeAfter.eq(expectAccumulatedTime)).true

            const rewardsDeductionRate = await AliceStakingCall.rewardsDeductionRates(poolIndex, claimBlockNumber-1)
            // share 不变
            const [ sharesBefore, sharesAfter ] = await Promise.all([
                AliceStakingCall.shares(poolIndex, AliceSigner.address, claimBlockNumber - 1),
                AliceStakingCall.shares(poolIndex, AliceSigner.address, claimBlockNumber)
            ])
            expect(sharesBefore.eq(sharesAfter)).true

            // total share 不变
            const [ totalSharesBefore, totalSharesAfter ] = await Promise.all([
                AliceStakingCall.totalShares(poolIndex, claimBlockNumber - 1),
                AliceStakingCall.totalShares(poolIndex, claimBlockNumber)
            ])
            expect(totalSharesBefore.eq(totalSharesAfter)).true

            // earned 应该减少
            const [ earnedBefore, earnedAfter ] = await Promise.all([
                AliceStakingCall.earned(poolIndex, AliceSigner.address, rewardType, claimBlockNumber - 1),
                AliceStakingCall.earned(poolIndex, AliceSigner.address, rewardType, claimBlockNumber)
            ])
            // now=15 end time=20 result=end time - now
            // now=15 end time=40 result=end time - now > 12 就按12s计算
            // 如果结束时间大于当前区块时间 那么需要加上这个区块的奖励
            let timeDif = 0
            if (endTimeBefore.gt(claimTime)) {
                if (endTimeBefore.sub(claimTime).gt(AVERAGE_BLOCK_TIME)) {
                    timeDif = AVERAGE_BLOCK_TIME
                } else {
                    timeDif = endTimeBefore.sub(claimTime)
                }
            }
            const expectEarned = earnedBefore.add(rewardRateBefore.mul(sharesBefore.div(totalSharesBefore)).mul(timeDif))
            console.log("expectEarned", expectEarned.toString());
            
            const deduction = expectEarned.mul(rewardsDeductionRate).div("1000000000000000000")
            const expectRewards = expectEarned.sub(deduction)
            const addedAccumulatedRate = deduction.mul("1000000000000000000").div(totalSharesBefore)
            const expectRewardRateAccumulated = rewardRateAccumulatedBefore.add(addedAccumulatedRate)
            expect(expectRewardRateAccumulated.eq(rewardRateAccumulatedAfter))
            console.log("rewardRateAccumulatedBefore", rewardRateAccumulatedBefore.toString());

            console.log("rewardRateAccumulatedAfter", rewardRateAccumulatedAfter.toString());
            

            // 如果没有灼烧奖励 则为0
            const expectEarnedAfter = addedAccumulatedRate.isZero() ? 0 : sharesBefore.mul(addedAccumulatedRate).div("1000000000000000000")

            console.log("earnedBefore", earnedBefore.toString())
            console.log("earnedAfter", earnedAfter.toString())
            console.log("expectEarnedAfter", expectEarnedAfter.toString())
            expect(earnedAfter.eq(expectEarnedAfter)).true

            const [
                stakingBalanceBefore,
                aliceBalanceBefore,
                stakingBalanceAfter,
                aliceBalanceAfter
            ] = await Promise.all([
                await iERC20Call.balanceOf(PROXYCONTRACT as string, claimBlockNumber - 1),
                await iERC20Call.balanceOf(AliceSigner.address, claimBlockNumber - 1),
                await iERC20Call.balanceOf(PROXYCONTRACT as string, claimBlockNumber),
                await iERC20Call.balanceOf(AliceSigner.address, claimBlockNumber)
            ])
            console.log("1", stakingBalanceBefore.toString(), stakingBalanceAfter.toString(), expectRewards.toString());
            
            // 检查合约和staker的奖励资产变化
            expect(stakingBalanceBefore.eq(stakingBalanceAfter.add(expectRewards))).true
            expect(aliceBalanceBefore.eq(aliceBalanceAfter.sub(expectRewards))).true


            // rewards应该=0或者灼烧奖励分配
            const rewardsAfter = await AliceStakingCall.rewards(poolIndex, AliceSigner.address, rewardType, claimBlockNumber)
            expect(rewardsAfter.eq(expectEarnedAfter))

            const pendingRewardRate = expectAccumulatedTime.sub(lastAccumulatedTimeAfter).mul(rewardRateAfter).mul("1000000000000000000").div(totalSharesAfter);
            console.log("pendingRewardRate", pendingRewardRate.toString());
            console.log("expectAccumulatedTime:", expectAccumulatedTime.toString())
            console.log("lastAccumulatedTimeAfter", lastAccumulatedTimeAfter.toString());

            const expectPerShare = totalSharesAfter.isZero() ? rewardRateAccumulatedAfter : rewardRateAccumulatedAfter.add(pendingRewardRate)
            const [rewardPerShareBefore, rewardPerShareAfter] = await Promise.all([
                AliceStakingCall.rewardPerShare(poolIndex, rewardType, claimBlockNumber - 1),
                AliceStakingCall.rewardPerShare(poolIndex, rewardType, claimBlockNumber)
            ])
            console.log(rewardPerShareAfter.toString(), expectPerShare.toString());
            
            expect(rewardPerShareAfter.eq(expectPerShare)).true

            // paidAccumulatedRates 应该=rewardPerShareBefore
            // 如果奖励没结束的话 会少计算一个区块的奖励 所以应该等于rewardsPerSharesAfter
            const expectPaidAccumulatedRates = endTimeBefore.gt(claimTime) ? rewardPerShareAfter : rewardPerShareBefore
            expect((await AliceStakingCall.paidAccumulatedRates(poolIndex, AliceSigner.address, rewardType, claimBlockNumber)).eq(expectPaidAccumulatedRates)).true
        }

        // 检查updateRewardRule后的奖励规则变化
        const checkRewardRule = async (txHash: string, poolIndex: number, expectRewardType: ContractAddress, expectRewardRate: Amount, expectEndTime: number|string, expectRewardTypes: string[]) => {
            const { blockNumber: updateBlockNumber } = await provider.getTransaction(txHash)
            const { timestamp: updateTime } = await provider.getBlock(updateBlockNumber as number)

            // 检查奖励币种类型
            const rewardTypes = await AliceStakingCall.rewardTypes(poolIndex)
            expect(rewardTypes.length).eq(expectRewardTypes.length)
            for(let i=0; i< expectRewardTypes.length; i++) {
                expect(rewardTypes[i]).eq(expectRewardTypes[i])
            }

            // 检查奖励规则
            let expectRewardRateAccumulated = 0
            const { 
                rewardRate: lastRewardRate, 
                endTime: lastEndTime, 
                rewardRateAccumulated: lastRewardRateAccumulated, 
                lastAccumulatedTime: lastLastAccumulatedTime 
            } = await AliceStakingCall.rewardRules(poolIndex, expectRewardType)

            const { rewardRate, endTime, rewardRateAccumulated, lastAccumulatedTime } = await AliceStakingCall.rewardRules(poolIndex, expectRewardType)
            console.log(rewardRate.toString(), endTime.toString(), rewardRateAccumulated.toString(), lastAccumulatedTime.toString());

            if (!lastEndTime.isZero() && lastEndTime.gt(updateTime)) {
                const totalShares = await AliceStakingCall.totalShares(poolIndex)
                const rewardTime = BigNumber.from(updateTime).sub(lastLastAccumulatedTime)  // 计算上次奖励持续了多久
                expectRewardRateAccumulated = lastRewardRateAccumulated.add(lastRewardRate.mul(rewardTime).mul("1000000000000000000").div(totalShares)) // 预期已发放的奖励率 = reward rate * 已发放奖励时间 * 1e18 / share
                console.log("totalShares", totalShares.toString());
                console.log("rewardTime", rewardTime.toString());
                console.log("expectRewardRateAccumulated", expectRewardRateAccumulated.toString());
                
            }

            // 如果设置的end time小于当前时间 则设置为当前时间
            if (ethers.BigNumber.from(expectEndTime).lt(updateTime)) {
                expectEndTime = updateTime
            }
            
            expect(rewardRate.eq(expectRewardRate)).true
            expect(endTime.eq(expectEndTime)).true
            expect(rewardRateAccumulated.eq(expectRewardRateAccumulated)).true
            expect(lastAccumulatedTime.eq(updateTime)).true

            return { updateBlockNumber, updateTime }
        }

        // 检查convert情况
        const checkConvertLSDPool = async (txHash: string, poolIndex: number, convertType: ConvertType) => {
            const { blockNumber: convertBlockNumber } = await provider.getTransaction(txHash) as { blockNumber: number}

            const { from, to } = getConversion(convertType)
            const fromErc20Call = new IERC20Call(from, AliceSigner)
            const toErc20Call = new IERC20Call(to, AliceSigner)
            const [stakingFromBalanceBefore, stakingToBalanceBefore, sharesBefore, totalSharesBefore] = await Promise.all([
                fromErc20Call.balanceOf(PROXYCONTRACT as string, convertBlockNumber - 1),
                toErc20Call.balanceOf(PROXYCONTRACT as string, convertBlockNumber - 1),
                AliceStakingCall.shares(poolIndex, AliceSigner.address, convertBlockNumber - 1),
                AliceStakingCall.totalShares(poolIndex, convertBlockNumber - 1),
            ]);
            const { convertedShareType: convertedShareTypeBefore, convertedExchangeRate: convertedExchangeRateBefore } = await AliceStakingCall.convertInfos(poolIndex, convertBlockNumber - 1)
            // 转化之前的convertedShareType应该为黑洞地址
            expect(convertedShareTypeBefore).eq(BLACK_HOLE)
            // 转化之前的convertedExchangeRate应该为0
            expect(convertedExchangeRateBefore.isZero()).true
            const { convertedShareType, convertedExchangeRate } = await AliceStakingCall.convertInfos(poolIndex, convertBlockNumber)
            const convertedAmount = convertedExchangeRate.mul(totalSharesBefore).div("1000000000000000000")
            expect(ethers.utils.getAddress(convertedShareType)).eq(ethers.utils.getAddress(to))
            const [stakingFromBalanceAfter, stakingToBalanceAfter, sharesAfter, totalSharesAfter] = await Promise.all([
                fromErc20Call.balanceOf(PROXYCONTRACT as string, convertBlockNumber),
                toErc20Call.balanceOf(PROXYCONTRACT as string, convertBlockNumber),
                AliceStakingCall.shares(poolIndex, AliceSigner.address, convertBlockNumber),
                AliceStakingCall.totalShares(poolIndex, convertBlockNumber),
            ]);
            expect(stakingFromBalanceBefore.eq(stakingFromBalanceAfter.add(totalSharesBefore))).true
            expect(stakingToBalanceBefore.eq(stakingToBalanceAfter.sub(convertedAmount))).true
            expect(sharesBefore.eq(sharesAfter)).true
            expect(totalSharesBefore.eq(totalSharesAfter)).true
        }

        // done
        describe.skip("新增池子 add pool", () => {
            it.skip("add pool => should success", async () => {
                const poolIndexBefore = await AliceStakingCall.PoolIndex()
                const tx = await AliceStakingCall.addPool(shareToken)
                await tx.wait()
                poolId = poolIndexBefore
                const poolIndexAfter = await AliceStakingCall.PoolIndex()
                expect(poolIndexAfter.sub(poolIndexBefore).eq(1)).true
                expect(await AliceStakingCall.shareTypes(poolIndexBefore)).eq(shareToken)
                const convertInfo = await AliceStakingCall.convertInfos(poolIndexBefore)
                expect(convertInfo.convertedShareType).eq(BLACK_HOLE)
                expect(convertInfo.convertedExchangeRate.eq(0)).true
                expect((await AliceStakingCall.rewardTypes(poolIndexBefore)).length).eq(0)
                expect((await AliceStakingCall.rewardsDeductionRates(poolIndexBefore)).eq(0)).true
                expect((await AliceStakingCall.totalShares(poolIndexBefore)).eq(0));
            })
        })
        
        // done
        describe.skip("质押资产 stake", () => {
            it.skip("用户在不存在的池子stake. user stake in non-existent pool => should reject", async () => {
                await expectRevert(AliceStakingCall.stake(999, amount), PoolNotExist)
            })
    
            it.skip("用户在存在的池子stake. user stake in existing pool => should success", async () => {
                const tx = await AliceStakingCall.stake(poolId, amount)
                await checkStake(tx.hash, poolId, DOT as string, amount)
            })
    
            it.skip("用户在存在的池子stake 0. => should reject", async () => {
                await expectRevert(AliceStakingCall.stake(poolId, 0), CannotStake0)
            })
    
            it.skip("用户未approve erc20时stake. => should reject", async () => {
                await DOTCall.approve(PROXYCONTRACT as string, 0)
                expect((await DOTCall.allowance(AliceSigner.address, PROXYCONTRACT as string)).eq(0)).true
                await expectRevert(AliceStakingCall.stake(poolId, amount), InsufficientAllowance)
    
                // 还原approve
                await DOTCall.approve(PROXYCONTRACT as string, MAX_UINT_AMOUNT)
                expect((await DOTCall.allowance(AliceSigner.address, PROXYCONTRACT as string)).eq(MAX_UINT_AMOUNT)).true
            })
    
            it.skip("用户stake的金额大于自身资产. users pledge assets in excess of the balance in an existing pool => should reject", async () => {
                await DOTCall.approve(PROXYCONTRACT as string, MAX_UINT_AMOUNT)
                expect((await DOTCall.allowance(AliceSigner.address, PROXYCONTRACT as string)).eq(MAX_UINT_AMOUNT)).true
                const userBalance = await DOTCall.balanceOf(AliceSigner.address)
                const testAmount = userBalance.add(1)
                await expectRevert(AliceStakingCall.stake(poolId, testAmount), BalanceLow)
            })
        })
        
        // done 1 bug
        describe.skip("取消质押资产 unstake", () => {
            let staked: ethers.BigNumber
            before(async () => {
                staked = await AliceStakingCall.shares(poolId, AliceSigner.address)
                if (staked.eq(0)) {
                    await AliceStakingCall.stake(poolId, amount)
                    staked = ethers.BigNumber.from(amount)
                }
                console.log("share", staked.toString());
            })
            it.skip("不存在的池子发起unstake => should reject", async () => {
                await expectRevert(AliceStakingCall.unstake(999, amount), PoolNotExist)
            })

            it.skip("用户unstake 0 => should reject", async () => {
                await expectRevert(AliceStakingCall.unstake(poolId, 0), CannotUnstakeZero)
            })

            it("unstake 大于 stake的资产", async () => {
                console.log(staked.add(1).toString());
                await expectRevert(AliceStakingCall.unstake(poolId, staked.add(1)), ShareNotEnough)
            })

            it.skip("unstake 小与 stake的资产", async () => {
                const stakeAmount = staked.div(2)
                const tx = await AliceStakingCall.unstake(poolId, stakeAmount)
                await checkUnstake(tx.hash, poolId, DOT as string, stakeAmount)
                staked = stakeAmount
            })

            it.skip("unstake 等于 stake的资产", async () => {
                const tx = await AliceStakingCall.unstake(poolId, staked)
                await checkUnstake(tx.hash, poolId, DOT as string, staked)
                const shareAfter = await AliceStakingCall.shares(poolId, AliceSigner.address)
                staked = shareAfter
            })

            it.skip("未抵押资产发起unstake", async () => {
                if (!staked.isZero()) {
                    await AliceStakingCall.unstake(poolId, staked)
                }

                await expectRevert(AliceStakingCall.unstake(poolId, 1), ShareNotEnough)
            })
        })

        describe.skip("更新奖励 update reward rule", () => {
            // pass
            it.skip("设置不存在池子的奖励规则. not exist poolId updateRewardRule => should reject PoolMustExist", async () => {
                await expectRevert(AliceStakingCall.updateRewardRule(999, rewardToken, _rewardRate, passedEndTime), PoolMustExist)
            })
    
            // pass
            it.skip("设置存在且没有设置过奖励池子的奖励规则, 但奖励币种为黑洞地址. existing poolId updateRewardRule => should reject RewardTokenZero", async () => {
                await expectRevert(AliceStakingCall.updateRewardRule(poolId, BLACK_HOLE, _rewardRate, passedEndTime), RewardTokenZero)
            })

            // pass
            it.skip("设置存在池子的奖励规则, 但奖励数量为0. existing poolId updateRewardRule => should success", async () => {
                // poolId = Number((await AliceStakingCall.PoolIndex()).toString())
                // await AliceStakingCall.addPool(rewardToken)
                const tx = await AliceStakingCall.updateRewardRule(poolId, rewardToken, 0, passedEndTime)
                await checkRewardRule(tx.hash, poolId, rewardToken, 0, passedEndTime, [rewardToken])
            })

            // pass
            it.skip("设置存在池子的奖励规则, 但结束时间小于当前时间，结束时间应该为更新奖励的区块时间. existing poolId updateRewardRule => should success", async () => {
                const tx = await AliceStakingCall.updateRewardRule(poolId, rewardToken, _rewardRate, passedEndTime)
                await checkRewardRule(tx.hash, poolId, rewardToken, _rewardRate, passedEndTime, [rewardToken])
            })

            // pass
            it.skip("更新奖励规则, 减少奖励数量rewardRate", async () => {
                let shares = await AliceStakingCall.shares(poolId, AliceSigner.address)
                if(!shares.isZero()) {
                    await AliceStakingCall.stake(poolId, amount)
                    shares = amount
                }

                const currentBlockNumber = await provider.getBlockNumber()
                const { timestamp } = await provider.getBlock(currentBlockNumber);
                const endTime = timestamp + 120
                const tx1 = await AliceStakingCall.updateRewardRule(poolId, rewardToken, _rewardRate, endTime)
                await checkRewardRule(tx1.hash, poolId, rewardToken, _rewardRate, endTime, [rewardToken])
                await tx1.wait(1)
                const newRate = ethers.BigNumber.from(_rewardRate).div(2)
                const tx2 = await AliceStakingCall.updateRewardRule(poolId, rewardToken, newRate, endTime)
                await checkRewardRule(tx2.hash, poolId, rewardToken, newRate, endTime, [rewardToken])
            })

            // pass
            it.skip("更新奖励规则, 减少奖励时间endTime", async () => {
                let shares = await AliceStakingCall.shares(poolId, AliceSigner.address)
                if(!shares.isZero()) {
                    await AliceStakingCall.stake(poolId, amount)
                    shares = amount
                }

                const currentBlockNumber = await provider.getBlockNumber()
                const { timestamp } = await provider.getBlock(currentBlockNumber);
                const endTime = timestamp + 120
                const tx1 = await AliceStakingCall.updateRewardRule(poolId, rewardToken, _rewardRate, endTime)
                await checkRewardRule(tx1.hash, poolId, rewardToken, _rewardRate, endTime, [rewardToken])
                await tx1.wait(1)
                const newEndTime = endTime - 10
                const tx2 = await AliceStakingCall.updateRewardRule(poolId, rewardToken, _rewardRate, newEndTime)
                await checkRewardRule(tx2.hash, poolId, rewardToken, _rewardRate, newEndTime, [rewardToken])
            })

            // pass
            it.skip("更新奖励规则, 增加奖励数量rewardRate", async () => {
                let shares = await AliceStakingCall.shares(poolId, AliceSigner.address)
                if(!shares.isZero()) {
                    await AliceStakingCall.stake(poolId, amount)
                    shares = amount
                }

                const currentBlockNumber = await provider.getBlockNumber()
                const { timestamp } = await provider.getBlock(currentBlockNumber);
                const endTime = timestamp + 120
                const tx1 = await AliceStakingCall.updateRewardRule(poolId, rewardToken, _rewardRate, endTime)
                await checkRewardRule(tx1.hash, poolId, rewardToken, _rewardRate, endTime, [rewardToken])
                await tx1.wait(1)
                const newRate = ethers.BigNumber.from(_rewardRate).mul(2)
                const tx2 = await AliceStakingCall.updateRewardRule(poolId, rewardToken, newRate, endTime)
                await checkRewardRule(tx2.hash, poolId, rewardToken, newRate, endTime, [rewardToken])
            })

            // pass
            it.skip("更新奖励规则, 增加奖励时间endTime", async () => {
                let shares = await AliceStakingCall.shares(poolId, AliceSigner.address)
                if(!shares.isZero()) {
                    await AliceStakingCall.stake(poolId, amount)
                    shares = amount
                }

                const currentBlockNumber = await provider.getBlockNumber()
                const { timestamp } = await provider.getBlock(currentBlockNumber);
                const endTime = timestamp + 120
                const tx1 = await AliceStakingCall.updateRewardRule(poolId, rewardToken, _rewardRate, endTime)
                await checkRewardRule(tx1.hash, poolId, rewardToken, _rewardRate, endTime, [rewardToken])
                await tx1.wait(1)
                const newEndTime = endTime + 10
                const tx2 = await AliceStakingCall.updateRewardRule(poolId, rewardToken, _rewardRate, newEndTime)
                await checkRewardRule(tx2.hash, poolId, rewardToken, _rewardRate, newEndTime, [rewardToken])
            })

            // pass
            it.skip("过奖励时间后stake则无奖励", async () => {
                const shareBefore = await AliceStakingCall.shares(poolId, AliceSigner.address)
                if (!shareBefore.isZero()) {
                    await AliceStakingCall.unstake(poolId, shareBefore)
                }
                const earnedBefore = await AliceStakingCall.earned(poolId, rewardToken, AliceSigner.address)

                const tx = await AliceStakingCall.updateRewardRule(poolId, rewardToken, _rewardRate, passedEndTime)
                await checkRewardRule(tx.hash, poolId, rewardToken, _rewardRate, passedEndTime, [rewardToken])
                await tx.wait(1)
                const stakeTx = await AliceStakingCall.stake(poolId, amount)
                await stakeTx.wait(1)
                expect((await AliceStakingCall.shares(poolId, AliceSigner.address)).eq(amount))
                expect((await AliceStakingCall.earned(poolId, AliceSigner.address, rewardToken)).eq(earnedBefore)).true
            })

            // pass id=59
            it.skip("设置超过3个奖励币种类型 => should reject toManyRewardType", async () => {
                const poolIndex = 59// Number((await AliceStakingCall.PoolIndex()).toString())
                console.log(poolIndex);
                
                // await AliceStakingCall.addPool(DOT as string)
                // const tx = await AliceStakingCall.stake(poolIndex, amount)
                // await tx.wait(1)
                const currentBlockNumber = await provider.getBlockNumber()
                const { timestamp } = await provider.getBlock(currentBlockNumber);
                const endTime = timestamp + 120
                // const DOTTx = await AliceStakingCall.updateRewardRule(poolIndex, DOT as string, _rewardRate, endTime)
                // // const { updateTime: dotTime } = await checkRewardRule(DOTTx.hash, poolIndex, DOT as string, _rewardRate, endTime, [DOT as string])
                // await DOTTx.wait(1)
                // const lDOTTx = await AliceStakingCall.updateRewardRule(poolIndex, LDOT as string, _rewardRate, endTime)
                // await lDOTTx.wait(1)
                // const { updateTime: lDOTTime } = await checkRewardRule(lDOTTx.hash, poolIndex, LDOT as string, _rewardRate, endTime, [DOT as string, LDOT as string])
                // const LcDOTTx = await AliceStakingCall.updateRewardRule(poolIndex, LCDOT_13 as string, _rewardRate, endTime)
                // // const { updateTime: LcDOTTime } = await checkRewardRule(LcDOTTx.hash, poolIndex, LCDOT_13 as string, _rewardRate, endTime, [DOT as string, LDOT as string, LCDOT_13 as string])
                // await LcDOTTx.wait(1)

                // await expectRevert(AliceStakingCall.updateRewardRule(poolIndex, ACA as string, _rewardRate, endTime), TooManyRewardType)

                // const claimTx = await AliceStakingCall.claimRewards(poolIndex)
                // await checkReward(claimTx.hash, poolIndex, DOT as string)
                // await checkReward(claimTx.hash, poolIndex, LDOT as string)
                // await checkReward(claimTx.hash, poolIndex, LCDOT_13 as string)
                // await checkReward("0x1808afddd9f4402dc89158730d452f50df6118ef0fba39bf3bb7666a5a595819", poolIndex, DOT as string)
                // await checkReward("0x1808afddd9f4402dc89158730d452f50df6118ef0fba39bf3bb7666a5a595819", poolIndex, LDOT as string)
                // await checkReward("0x1808afddd9f4402dc89158730d452f50df6118ef0fba39bf3bb7666a5a595819", poolIndex, LCDOT_13 as string)
            })

            it.skip("奖励发放期有用户加入 检查奖励分配", async () => {
                const poolIndex = await AliceStakingCall.PoolIndex()
                await AliceStakingCall.addPool(DOT as string)
                console.log(poolIndex.toString());
                
                await AliceStakingCall.stake(poolIndex, amount)
                expect((await AliceStakingCall.shares(poolIndex, AliceSigner.address)).eq(amount))

                const currentBlockNumber = await provider.getBlockNumber()
                const { timestamp } = await provider.getBlock(currentBlockNumber);
                const duration = 120
                const endTime = timestamp + 120
                const tx = await AliceStakingCall.updateRewardRule(poolIndex, DOT as string, amount, endTime)
                console.log(tx.hash);
                await tx.wait(4)
                const { updateTime: timeBefore } = await checkRewardRule(tx.hash, poolIndex, DOT as string, _rewardRate, passedEndTime, [DOT as string])
                
                // 等待10个区块 等奖励到结束时间
                const stakeTx = await TestAStakingCall.stake(poolIndex, amount)
                await stakeTx.wait(6)
                expect((await TestAStakingCall.shares(poolIndex, TestASinger.address)).eq(amount))
                const { blockNumber } = await provider.getTransaction(stakeTx.hash)
                const { timestamp: timeAfter } = await provider.getBlock(blockNumber as number)

                // alice在设置奖励前就stake 所以实际获得奖励的时间等于duration
                // testA在中途进来 所以我们用奖励奖励结束时间-testA stake的时间 即可得到testA的实际奖励时间
                const testTimeDif = timeBefore + 120 - timeAfter

                const perShare = ethers.BigNumber.from(amount).div(duration)    // 每秒奖励

                // alice在testA加入进来之前 是独享100%的奖励 后续是50%
                const expectAliceEarned = perShare.mul(duration - testTimeDif).add(perShare.mul(testTimeDif).div(2))
                // testA是50%的奖励
                const expectTestAEarned = perShare.mul(testTimeDif).div(2)
                
                const aliceEarned = await AliceStakingCall.earned(poolIndex, AliceSigner.address, DOT as string)
                const testAEarned = await AliceStakingCall.earned(poolIndex, TestASinger.address, DOT as string)
                console.log(expectAliceEarned.toString(), aliceEarned.toString());
                console.log(testAEarned.toString(), testAEarned.toString());
                expect(aliceEarned.eq(expectAliceEarned)).true
                expect(testAEarned.eq(expectTestAEarned)).true
            })
        })

        // done
        describe.skip("提取奖励 claim reward", () => {
            it.skip("在不存在的池子claimRewards", async () => {
                await AliceStakingCall.claimRewards(999)
            })

            it.skip("没有可提取奖励时claimRewards => should success", async () => {
                const earned: ethers.BigNumber = await AliceStakingCall.earned(poolId, AliceSigner.address, DOT as string)
                if(!earned.isZero()) {
                    await AliceStakingCall.claimRewards(poolId)
                    expect((await AliceStakingCall.earned(poolId, AliceSigner.address, DOT as string)).isZero()).true
                }

                await AliceStakingCall.claimRewards(poolId)
            })

            it.skip("在奖励发放完成前 claim rewards. user claim rewards before the end of the pool rewards => should success", async () => {
                const poolIndex = await AliceStakingCall.PoolIndex()
                const duration = 120
                await AliceStakingCall.addPool(DOT as string)
                console.log(poolIndex.toString());
                
                await AliceStakingCall.stake(poolIndex, amount)
                expect((await AliceStakingCall.shares(poolIndex, AliceSigner.address)).eq(amount))
                const tx = await AliceStakingCall.updateRewardRule(poolIndex, DOT as string, amount, duration)
                console.log(tx.hash);
                const { blockNumber: block } = await provider.getTransaction(tx.hash)
                const { timestamp: startTime } = await provider.getBlock(block as number)
                const perShare = ethers.BigNumber.from(amount).div(duration)    // 每秒奖励

                const tx1 = await AliceStakingCall.claimRewards(poolIndex)
                const { blockNumber: block1 } = await provider.getTransaction(tx1.hash)
                const { timestamp } = await provider.getBlock(block1 as number)

                const timeDif = timestamp - startTime

                const expectAliceEarned = perShare.mul(timeDif)
                const aliceBalanceBefore = await DOTCall.balanceOf(AliceSigner.address, block1 as number - 1)
                const stakingBalanceBefore = await DOTCall.balanceOf(AliceSigner.address, block1 as number - 1)
                console.log("🚀 ~ file: stakeLSDCase.test.ts:800 ~ it ~ stakingBalanceBefore:", stakingBalanceBefore)
                const aliceBalanceAfter = await DOTCall.balanceOf(AliceSigner.address, block1 as number)
                const stakingBalanceAfter = await DOTCall.balanceOf(AliceSigner.address, block1 as number)
                console.log(expectAliceEarned.toString(), aliceBalanceBefore.toString(), stakingBalanceBefore.toString(), stakingBalanceAfter.toString());
                console.log("🚀 ~ file: stakeLSDCase.test.ts:804 ~ it ~ stakingBalanceBefore:", stakingBalanceBefore)
                

                expect(aliceBalanceBefore.eq(aliceBalanceAfter.sub(expectAliceEarned))).true
                expect(stakingBalanceBefore.eq(stakingBalanceAfter.add(expectAliceEarned))).true
                console.log("🚀 ~ file: stakeLSDCase.test.ts:809 ~ it ~ stakingBalanceBefore:", stakingBalanceBefore)
                expect((await AliceStakingCall.shares(poolIndex, AliceSigner.address)).eq(amount))
                expect((await AliceStakingCall.earned(poolIndex, AliceSigner.address, DOT as string, block1)).isZero())
                expect((await AliceStakingCall.rewards(poolIndex, AliceSigner.address, DOT as string, block1)).isZero())
            })

            it.skip("在奖励发放完成后 claim rewards. user claim rewards before the end of the pool rewards", async () => {
                let shares = await AliceStakingCall.shares(poolId, AliceSigner.address)
                if(!shares.isZero()) {
                    await AliceStakingCall.stake(poolId, amount)
                    shares = amount
                }

                const currentBlockNumber = await provider.getBlockNumber()
                const { timestamp } = await provider.getBlock(currentBlockNumber);
                const endTime = timestamp + 15
                const tx1 = await AliceStakingCall.updateRewardRule(poolId, DOT as string, _rewardRate, endTime)
                await tx1.wait(2)

                const tx2 = await AliceStakingCall.claimRewards(poolId)
                await checkReward(tx2.hash, poolId, rewardToken)
            })
        })

        // done
        describe.skip("设置池子操作状态 setPoolOperationPause", () => {
            let stakeStatus = false
            let unstakeStatus = false
            let claimRewardsStatus = false

            before("首先获取所有状态", async () => {
                [stakeStatus, unstakeStatus, claimRewardsStatus] = await Promise.all([
                    AliceStakingCall.pausedPoolOperations(poolId, Operation.Stake),
                    AliceStakingCall.pausedPoolOperations(poolId, Operation.Unstake),
                    AliceStakingCall.pausedPoolOperations(poolId, Operation.ClaimRewards),
                ]);
            })

            // after("恢复池子状态", async () => {
            //     await AliceStakingCall.setPoolOperationPause(poolId, Operation.Stake, false)
            //     expect(await AliceStakingCall.pausedPoolOperations(poolId, Operation.Stake)).false

            //     await AliceStakingCall.setPoolOperationPause(poolId, Operation.Unstake, false)
            //     expect(await AliceStakingCall.pausedPoolOperations(poolId, Operation.Unstake)).false

            //     await AliceStakingCall.setPoolOperationPause(poolId, Operation.ClaimRewards, false)
            //     expect(await AliceStakingCall.pausedPoolOperations(poolId, Operation.ClaimRewards)).false
            // })

            // pass
            it.skip("stake operation 设置为false时 恢复当前池子的 stake 操作", async () => {
                if (!stakeStatus) {
                    await AliceStakingCall.setPoolOperationPause(poolId, Operation.Stake, true)
                    expect(await AliceStakingCall.pausedPoolOperations(poolId, Operation.Stake)).true
                }
                await AliceStakingCall.setPoolOperationPause(poolId, Operation.Stake, false)
                expect(await AliceStakingCall.pausedPoolOperations(poolId, Operation.Stake)).false
                stakeStatus = false

                await AliceStakingCall.stake(poolId, amount)
                // 此处测试重点不在数据 简单检查一下功能即可
                expect((await AliceStakingCall.shares(poolId, AliceSigner.address)).eq(amount)).true
            })

            // pass
            it.skip("stake operation 设置为false时 可以再设置为false", async () => {
                if (stakeStatus) {
                    await AliceStakingCall.setPoolOperationPause(poolId, Operation.Stake, false)
                    expect(await AliceStakingCall.pausedPoolOperations(poolId, Operation.Stake)).false
                }
                await AliceStakingCall.setPoolOperationPause(poolId, Operation.Stake, false)
                expect(await AliceStakingCall.pausedPoolOperations(poolId, Operation.Stake)).false
                stakeStatus = false
            })

            // pass
            it.skip("stake operation 设置为true时 禁止当前池子的 stake 操作 其他池子不受影响", async () => {
                if (!stakeStatus) {
                    await AliceStakingCall.setPoolOperationPause(poolId, Operation.Stake, true)
                    expect(await AliceStakingCall.pausedPoolOperations(poolId, Operation.Stake)).true
                }

                // 检查当前池子
                await expectRevert(AliceStakingCall.stake(poolId, amount), OperationPaused)

                // 检查其他池子
                await AliceStakingCall.stake(poolId-1, amount)
                // 此处测试重点不在数据 简单检查一下功能即可
                expect((await AliceStakingCall.shares(poolId-1, AliceSigner.address)).eq(amount)).true
            })

            // pass
            it.skip("stake operation 设置为true时 可以再设置为true", async () => {
                if (!stakeStatus) {
                    await AliceStakingCall.setPoolOperationPause(poolId, Operation.Stake, true)
                    expect(await AliceStakingCall.pausedPoolOperations(poolId, Operation.Stake)).true
                }
                await AliceStakingCall.setPoolOperationPause(poolId, Operation.Stake, true)
                expect(await AliceStakingCall.pausedPoolOperations(poolId, Operation.Stake)).true
                stakeStatus = true
            })

            // pass
            it.skip("unstake operation 设置为false时 恢复当前池子的 unstake 操作", async () => {
                await AliceStakingCall.setPoolOperationPause(poolId, Operation.Unstake, false)
                expect(await AliceStakingCall.pausedPoolOperations(poolId, Operation.Unstake)).false

                let shares: ethers.BigNumber = await AliceStakingCall.shares(poolId, AliceSigner.address)
                if(shares.isZero()) {
                    await AliceStakingCall.setPoolOperationPause(poolId, Operation.Stake, false)
                    expect(await AliceStakingCall.pausedPoolOperations(poolId, Operation.Stake)).false
                    await AliceStakingCall.stake(poolId, amount)
                    expect((await AliceStakingCall.shares(poolId, AliceSigner.address)).eq(amount)).true
                    shares = ethers.BigNumber.from(amount)
                }
                // 此处测试重点不在数据 简单检查一下功能即可
                await AliceStakingCall.unstake(poolId, shares)
                expect((await AliceStakingCall.shares(poolId, AliceSigner.address)).isZero()).true
            })

            // pass
            it.skip("unstake operation 设置为false时 可以再设置为false", async () => {
                if (unstakeStatus) {
                    await AliceStakingCall.setPoolOperationPause(poolId, Operation.Unstake, false)
                    expect(await AliceStakingCall.pausedPoolOperations(poolId, Operation.Unstake)).false
                }
                await AliceStakingCall.setPoolOperationPause(poolId, Operation.Unstake, false)
                expect(await AliceStakingCall.pausedPoolOperations(poolId, Operation.Unstake)).false
                unstakeStatus = false
            })

            // pass
            it.skip("unstake operation 设置为true时 禁止当前池子的 unstake 操作 其他池子不受影响", async () => {
                await AliceStakingCall.setPoolOperationPause(poolId, Operation.Unstake, true)
                expect(await AliceStakingCall.pausedPoolOperations(poolId, Operation.Unstake)).true

                // 检查当前池子
                await expectRevert(AliceStakingCall.unstake(poolId, amount), OperationPaused)

                const otherPoolId = poolId - 1
                let shares: ethers.BigNumber = await AliceStakingCall.shares(otherPoolId, AliceSigner.address)
                if(shares.isZero()) {
                    await AliceStakingCall.setPoolOperationPause(otherPoolId, Operation.Stake, false)
                    expect(await AliceStakingCall.pausedPoolOperations(otherPoolId, Operation.Stake)).false
                    await AliceStakingCall.stake(otherPoolId, amount)
                    expect((await AliceStakingCall.shares(otherPoolId, AliceSigner.address)).eq(amount)).true
                    shares = ethers.BigNumber.from(amount)
                }
                // 此处测试重点不在数据 简单检查一下功能即可
                await AliceStakingCall.unstake(otherPoolId, shares)
                expect((await AliceStakingCall.shares(otherPoolId, AliceSigner.address)).isZero()).true
            })

            // pass
            it.skip("unstake operation 设置为true时 可以再设置为true", async () => {
                if (!unstakeStatus) {
                    await AliceStakingCall.setPoolOperationPause(poolId, Operation.Unstake, true)
                    expect(await AliceStakingCall.pausedPoolOperations(poolId, Operation.Unstake)).true
                }
                await AliceStakingCall.setPoolOperationPause(poolId, Operation.Unstake, true)
                expect(await AliceStakingCall.pausedPoolOperations(poolId, Operation.Unstake)).true
                unstakeStatus = true
            })

            // pass
            it.skip("claimRewards operation 设置为false时 恢复当前池子的 claimRewards 操作", async () => {
                if (!claimRewardsStatus) {
                    await AliceStakingCall.setPoolOperationPause(poolId, Operation.ClaimRewards, true)
                    expect(await AliceStakingCall.pausedPoolOperations(poolId, Operation.ClaimRewards)).true
                }
                await AliceStakingCall.setPoolOperationPause(poolId, Operation.ClaimRewards, false)
                expect(await AliceStakingCall.pausedPoolOperations(poolId, Operation.ClaimRewards)).false

                let earned = await AliceStakingCall.earned(poolId, AliceSigner.address, DOT as string)
                if (earned.isZero()) {
                    let shares = await AliceStakingCall.shares(poolId, AliceSigner.address)
                
                    if (shares.isZero()) {
                        await AliceStakingCall.stake(poolId, amount)
                        expect((await AliceStakingCall.shares(poolId, AliceSigner.address)).eq(amount)).true
                    }

                    await (await AliceStakingCall.updateRewardRule(poolId, DOT as string, _rewardRate, passedEndTime)).wait(1)
                    earned = await AliceStakingCall.earned(poolId, AliceSigner.address, DOT as string)
                }

                const stakingBalanceBefore = await DOTCall.balanceOf(PROXYCONTRACT as string)
                console.log("🚀 ~ file: stakeLSDCase.test.ts:981 ~ it.skip ~ stakingBalanceBefore:", stakingBalanceBefore)
                const aliceBalanceBefore = await DOTCall.balanceOf(AliceSigner.address)
                
                await AliceStakingCall.claimRewards(poolId)

                const stakingBalanceAfter = await DOTCall.balanceOf(PROXYCONTRACT as string)
                const aliceBalanceAfter = await DOTCall.balanceOf(AliceSigner.address)

                expect(stakingBalanceBefore.eq(stakingBalanceAfter.add(earned))).true
                console.log("🚀 ~ file: stakeLSDCase.test.ts:990 ~ it.skip ~ stakingBalanceBefore:", stakingBalanceBefore)
                expect(aliceBalanceBefore.eq(aliceBalanceAfter.sub(earned))).true
                expect((await AliceStakingCall.earned(poolId, AliceSigner.address, DOT as string)).isZero()).true
            })

            // pass
            it.skip("claimRewards operation 设置为false时 可以再设置为false", async () => {
                if (claimRewardsStatus) {
                    await AliceStakingCall.setPoolOperationPause(poolId, Operation.ClaimRewards, false)
                    expect(await AliceStakingCall.pausedPoolOperations(poolId, Operation.ClaimRewards)).false
                }
                await AliceStakingCall.setPoolOperationPause(poolId, Operation.ClaimRewards, false)
                expect(await AliceStakingCall.pausedPoolOperations(poolId, Operation.ClaimRewards)).false
                claimRewardsStatus = false
            })

            // pass
            it.skip("claimRewards operation 设置为true时 禁止当前池子的 claimRewards 操作 其他池子不受影响", async () => {
                if (!claimRewardsStatus) {
                    await AliceStakingCall.setPoolOperationPause(poolId, Operation.ClaimRewards, true)
                    expect(await AliceStakingCall.pausedPoolOperations(poolId, Operation.ClaimRewards)).true
                }

                // 检查当前池子是否暂停claim rewards
                await expectRevert(AliceStakingCall.claimRewards(poolId), OperationPaused)

                const otherPool = poolId - 1

                let earned = await AliceStakingCall.earned(otherPool, AliceSigner.address, DOT as string)
                if (earned.isZero()) {
                    const shares = await AliceStakingCall.shares(otherPool, AliceSigner.address)
                
                    if (shares.isZero()) {
                        await AliceStakingCall.stake(otherPool, amount)
                        expect((await AliceStakingCall.shares(otherPool, AliceSigner.address)).eq(amount)).true
                    }
                    await (await AliceStakingCall.updateRewardRule(otherPool, DOT as string, amount, 1)).wait(1)
                    earned = await AliceStakingCall.earned(otherPool, AliceSigner.address, DOT as string)
                }

                const stakingBalanceBefore = await DOTCall.balanceOf(PROXYCONTRACT as string)
                console.log("🚀 ~ file: stakeLSDCase.test.ts:1031 ~ it.skip ~ stakingBalanceBefore:", stakingBalanceBefore)
                const aliceBalanceBefore = await DOTCall.balanceOf(AliceSigner.address)
                
                await AliceStakingCall.claimRewards(otherPool)

                const stakingBalanceAfter = await DOTCall.balanceOf(PROXYCONTRACT as string)
                const aliceBalanceAfter = await DOTCall.balanceOf(AliceSigner.address)

                expect(stakingBalanceBefore.eq(stakingBalanceAfter.add(earned))).true
                console.log("🚀 ~ file: stakeLSDCase.test.ts:1040 ~ it.skip ~ stakingBalanceBefore:", stakingBalanceBefore)
                expect(aliceBalanceBefore.eq(aliceBalanceAfter.sub(earned))).true
                expect((await AliceStakingCall.earned(otherPool, AliceSigner.address, DOT as string)).isZero()).true
            })

            // pass
            it.skip("claimRewards operation 设置为true时 可以再设置为true", async () => {
                if (!claimRewardsStatus) {
                    await AliceStakingCall.setPoolOperationPause(poolId, Operation.ClaimRewards, true)
                    expect(await AliceStakingCall.pausedPoolOperations(poolId, Operation.ClaimRewards)).true
                }
                await AliceStakingCall.setPoolOperationPause(poolId, Operation.ClaimRewards, true)
                expect(await AliceStakingCall.pausedPoolOperations(poolId, Operation.ClaimRewards)).true
                claimRewardsStatus = true
            })
        })

        // done 1 bug
        describe("退出 exit", () => {
            before(async () => {
                const [stakeStatus, unstakeStatus, claimRewardsStatus] = await Promise.all([
                    AliceStakingCall.pausedPoolOperations(poolId, Operation.Stake),
                    AliceStakingCall.pausedPoolOperations(poolId, Operation.Unstake),
                    AliceStakingCall.pausedPoolOperations(poolId, Operation.ClaimRewards),
                ]);

                if (stakeStatus) {
                    await AliceStakingCall.setPoolOperationPause(poolId, Operation.Stake, false)
                }

                if (unstakeStatus) {
                    await AliceStakingCall.setPoolOperationPause(poolId, Operation.Unstake, false)
                }

                if (claimRewardsStatus) {
                    await AliceStakingCall.setPoolOperationPause(poolId, Operation.ClaimRewards, false)
                }
            })

            // 预期应该返回 cannot unstake 0 因为是在staking合约直接帮用户调用unstake(poolId, shares(user))
            it.skip("不存在的池子 exit", async () => {
                await expectRevert(AliceStakingCall.exit(999), CannotUnstakeZero)
            })

            // pass
            it.skip("在没有stake share时 exit => should reject: cannot unstake 0", async () => {
                const shares = await AliceStakingCall.shares(poolId, AliceSigner.address)
                
                if (!shares.isZero()) {
                    await AliceStakingCall.unstake(poolId, shares)
                    expect((await AliceStakingCall.shares(poolId, AliceSigner.address)).isZero()).true
                }
                
                await expectRevert(AliceStakingCall.exit(poolId), CannotUnstakeZero)
            })

            // pass
            it.skip("在有stake share时且有奖励 exit", async () => {
                let sharesBefore = await AliceStakingCall.shares(poolId, AliceSigner.address)

                if (sharesBefore.isZero()) {
                    await AliceStakingCall.stake(poolId, amount)
                    expect((await AliceStakingCall.shares(poolId, AliceSigner.address)).eq(amount)).true
                    sharesBefore = ethers.BigNumber.from(amount)
                }

                let earned = await AliceStakingCall.earned(poolId, AliceSigner.address, DOT as string)
                if (earned.isZero()) {
                    const currentBlockNumber = await provider.getBlockNumber()
                    const { timestamp } = await provider.getBlock(currentBlockNumber);
                    const endTime = timestamp + 180
                    await (await AliceStakingCall.updateRewardRule(poolId, DOT as string, _rewardRate, endTime)).wait(1)
                    earned = await AliceStakingCall.earned(poolId, AliceSigner.address, DOT as string)
                }

                const stakingBalanceBefore = await DOTCall.balanceOf(PROXYCONTRACT as string)
                console.log("🚀 ~ file: stakeLSDCase.test.ts:1119 ~ it ~ stakingBalanceBefore:", stakingBalanceBefore)
                const aliceBalanceBefore = await DOTCall.balanceOf(AliceSigner.address)
                const totalShareBefore = await AliceStakingCall.totalShares(poolId)
                
                await AliceStakingCall.exit(poolId)

                const stakingBalanceAfter = await DOTCall.balanceOf(PROXYCONTRACT as string)
                const aliceBalanceAfter = await DOTCall.balanceOf(AliceSigner.address)
                const shareAfter = await AliceStakingCall.shares(poolId, AliceSigner.address)
                const totalShareAfter = await AliceStakingCall.totalShares(poolId)

                expect(stakingBalanceBefore.eq(stakingBalanceAfter.add(sharesBefore).add(earned))).true
                console.log("🚀 ~ file: stakeLSDCase.test.ts:1131 ~ it ~ stakingBalanceBefore:", stakingBalanceBefore)
                expect(aliceBalanceBefore.eq(aliceBalanceAfter.sub(sharesBefore).sub(earned))).true
                expect(sharesBefore.eq(shareAfter.add(sharesBefore))).true
                expect(totalShareBefore.eq(totalShareAfter.add(sharesBefore))).true
                
            })

            // pass
            it.skip("在有stake share时且没有奖励 exit", async () => {
                let sharesBefore = await AliceStakingCall.shares(poolId, AliceSigner.address)
                
                if (sharesBefore.isZero()) {
                    await AliceStakingCall.stake(poolId, amount)
                    expect((await AliceStakingCall.shares(poolId, AliceSigner.address)).eq(amount)).true
                    sharesBefore = ethers.BigNumber.from(amount)
                }

                const earned = await AliceStakingCall.earned(poolId, AliceSigner.address, DOT as string)
                if (!earned.isZero()) {
                    await AliceStakingCall.claimRewards(poolId)
                    expect((await AliceStakingCall.earned(poolId, AliceSigner.address, DOT as string)).isZero()).true
                }

                const stakingBalanceBefore = await DOTCall.balanceOf(PROXYCONTRACT as string)
                console.log("🚀 ~ file: stakeLSDCase.test.ts:1154 ~ it.skip ~ stakingBalanceBefore:", stakingBalanceBefore)
                const aliceBalanceBefore = await DOTCall.balanceOf(AliceSigner.address)
                const totalShareBefore = await AliceStakingCall.totalShares(poolId)
                
                await AliceStakingCall.exit(poolId)

                const stakingBalanceAfter = await DOTCall.balanceOf(PROXYCONTRACT as string)
                const aliceBalanceAfter = await DOTCall.balanceOf(AliceSigner.address)
                const shareAfter = await AliceStakingCall.shares(poolId, AliceSigner.address)
                const totalShareAfter = await AliceStakingCall.totalShares(poolId)

                expect(stakingBalanceBefore.eq(stakingBalanceAfter.add(sharesBefore))).true
                console.log("🚀 ~ file: stakeLSDCase.test.ts:1166 ~ it.skip ~ stakingBalanceBefore:", stakingBalanceBefore)
                expect(aliceBalanceBefore.eq(aliceBalanceAfter.sub(sharesBefore))).true
                expect(sharesBefore.eq(shareAfter.add(sharesBefore))).true
                expect(totalShareBefore.eq(totalShareAfter.add(sharesBefore))).true
            })
        })

        // done
        describe.skip("设置池子灼烧奖励 setRewardsDeductionRate", () => {
            before(async () => {
                const [stakeStatus, unstakeStatus, claimRewardsStatus] = await Promise.all([
                    AliceStakingCall.pausedPoolOperations(poolId, Operation.Stake),
                    AliceStakingCall.pausedPoolOperations(poolId, Operation.Unstake),
                    AliceStakingCall.pausedPoolOperations(poolId, Operation.ClaimRewards),
                ]);

                if (stakeStatus) {
                    await AliceStakingCall.setPoolOperationPause(poolId, Operation.Stake, false)
                }

                if (unstakeStatus) {
                    await AliceStakingCall.setPoolOperationPause(poolId, Operation.Unstake, false)
                }

                if (claimRewardsStatus) {
                    await AliceStakingCall.setPoolOperationPause(poolId, Operation.ClaimRewards, false)
                }
            })

            // after(async () => {
            //     await AliceStakingCall.setRewardsDeductionRate(poolId, 0)
            //     expect((await AliceStakingCall.rewardsDeductionRates(poolId)).isZero()).true
            // })

            // pass
            it.skip("不存在的池子设置灼烧奖励 => should reject", async () => {
                await expectRevert(AliceStakingCall.setRewardsDeductionRate(999, '1000000000000000000'), PoolNotExist)
            })

            // pass
            it.skip("灼烧率大于100% 即1e18+1 => should reject", async () => {
                await expectRevert(AliceStakingCall.setRewardsDeductionRate(poolId, '1000000000000000001'), WrongRate)
            })

            // pass
            it.skip("设置灼烧奖励为50%, 当stake user就一个人时 灼烧奖励就发给自己", async () => {
                const _deductionRate = "500000000000000000"
                await AliceStakingCall.setRewardsDeductionRate(poolId, _deductionRate)
                expect((await AliceStakingCall.rewardsDeductionRates(poolId)).eq(_deductionRate)).true

                let shares: ethers.BigNumber = await AliceStakingCall.shares(poolId, AliceSigner.address)
                let earned = await AliceStakingCall.earned(poolId, AliceSigner.address, DOT as string)
                if (earned.isZero()) {
                    if (shares.isZero()) {
                        await AliceStakingCall.stake(poolId, amount)
                        expect((await AliceStakingCall.shares(poolId, AliceSigner.address)).eq(amount)).true
                        shares = ethers.BigNumber.from(amount)
                    }
                    const currentBlockNumber = await provider.getBlockNumber()
                    const { timestamp } = await provider.getBlock(currentBlockNumber);
                    const endTime = timestamp + 180
                    await (await AliceStakingCall.updateRewardRule(poolId, DOT as string, _rewardRate, endTime)).wait(1)
                    earned = await AliceStakingCall.earned(poolId, AliceSigner.address, DOT as string)
                }

                const deduction = earned.mul(_deductionRate).div("1000000000000000000")
                const rewards = earned.sub(deduction)
                console.log(deduction.toString(), rewards.toString());
                
                const stakingBalanceBefore = await DOTCall.balanceOf(PROXYCONTRACT as string)
                console.log("🚀 ~ file: stakeLSDCase.test.ts:1233 ~ it.skip ~ stakingBalanceBefore:", stakingBalanceBefore)
                const aliceBalanceBefore = await DOTCall.balanceOf(AliceSigner.address)
                
                await AliceStakingCall.claimRewards(poolId)

                const stakingBalanceAfter = await DOTCall.balanceOf(PROXYCONTRACT as string)
                const aliceBalanceAfter = await DOTCall.balanceOf(AliceSigner.address)

                expect(stakingBalanceBefore.eq(stakingBalanceAfter.add(rewards))).true
                console.log("🚀 ~ file: stakeLSDCase.test.ts:1242 ~ it.skip ~ stakingBalanceBefore:", stakingBalanceBefore)
                expect(aliceBalanceBefore.eq(aliceBalanceAfter.sub(rewards))).true
                expect((await AliceStakingCall.earned(poolId, AliceSigner.address, DOT as string)).eq(deduction)).true
            })

            // pass
            it.skip("设置灼烧奖励为50%, 当stake user有多个人时 灼烧奖励就发给多人（包括自己）", async () => {
                const _deductionRate = "500000000000000000"
                await AliceStakingCall.setRewardsDeductionRate(poolId, _deductionRate)
                expect((await AliceStakingCall.rewardsDeductionRates(poolId)).eq(_deductionRate)).true

                // 准备测试数据
                let aliceEarned = await AliceStakingCall.earned(poolId, AliceSigner.address, DOT as string)
                let aliceShare = await AliceStakingCall.shares(poolId, AliceSigner.address)
                let testAccountEarned = await TestAStakingCall.earned(poolId, TestASinger.address, DOT as string)
                let testShare = await TestAStakingCall.shares(poolId, TestASinger.address)
                if (aliceEarned.isZero() || testAccountEarned.isZero()) {
                    if (aliceShare.isZero()) {
                        await AliceStakingCall.stake(poolId, amount)
                        expect((await AliceStakingCall.shares(poolId, AliceSigner.address)).eq(amount)).true
                        aliceShare = ethers.BigNumber.from(amount)
                    }

                    if (testShare.isZero()) {
                        await TestAStakingCall.stake(poolId, amount)
                        expect((await TestAStakingCall.shares(poolId, TestASinger.address)).eq(amount)).true
                        testShare = ethers.BigNumber.from(amount)
                    }

                    const currentBlockNumber = await provider.getBlockNumber()
                    const { timestamp } = await provider.getBlock(currentBlockNumber);
                    const endTime = timestamp + 180
                    await (await AliceStakingCall.updateRewardRule(poolId, DOT as string, _rewardRate, endTime)).wait(1)
                    aliceEarned = await AliceStakingCall.earned(poolId, AliceSigner.address, DOT as string)
                    testAccountEarned = await TestAStakingCall.earned(poolId, TestASinger.address, DOT as string)
                }

                const totalShare = await AliceStakingCall.totalShares(poolId)

                // 计算alice的deduction和rewards
                const aliceDeduction = aliceEarned.mul(_deductionRate).div("1000000000000000000")
                const aliceRewards = aliceEarned.sub(aliceDeduction)
                console.log(aliceDeduction.toString(), aliceRewards.toString());
                
                let stakingBalanceBefore = await DOTCall.balanceOf(PROXYCONTRACT as string)
                console.log("🚀 ~ file: stakeLSDCase.test.ts:1284 ~ it.skip ~ stakingBalanceBefore:", stakingBalanceBefore)
                let aliceBalanceBefore = await DOTCall.balanceOf(AliceSigner.address)
                await AliceStakingCall.claimRewards(poolId)
                let stakingBalanceAfter = await DOTCall.balanceOf(PROXYCONTRACT as string)
                let aliceBalanceAfter = await DOTCall.balanceOf(AliceSigner.address)

                // 输出上面的结果
                console.log(stakingBalanceBefore.toString(), stakingBalanceAfter.toString());
                console.log("🚀 ~ file: stakeLSDCase.test.ts:1292 ~ it.skip ~ stakingBalanceBefore:", stakingBalanceBefore)
                console.log(aliceBalanceBefore.toString(), aliceBalanceAfter.toString());

                expect(stakingBalanceBefore.eq(stakingBalanceAfter.add(aliceRewards))).true
                console.log("🚀 ~ file: stakeLSDCase.test.ts:1296 ~ it.skip ~ stakingBalanceBefore:", stakingBalanceBefore)
                expect(aliceBalanceBefore.eq(aliceBalanceAfter.sub(aliceRewards))).true
                let aliceEarnedAfterClaim = await AliceStakingCall.earned(poolId, AliceSigner.address, DOT as string)
                let testAccountEarnedAfterClaim = await TestAStakingCall.earned(poolId, TestASinger.address, DOT as string)
                expect(aliceEarnedAfterClaim.eq(aliceDeduction.mul(aliceShare).div(totalShare))).true
                expect(testAccountEarnedAfterClaim.eq(testAccountEarned.add(aliceDeduction.mul(testShare).div(totalShare)))).true

                const testDeduction = testAccountEarnedAfterClaim.mul(_deductionRate).div("1000000000000000000")
                const testRewards = testAccountEarnedAfterClaim.sub(testDeduction)
                console.log(testDeduction.toString(), testRewards.toString());

                stakingBalanceBefore = stakingBalanceAfter
                console.log("🚀 ~ file: stakeLSDCase.test.ts:1308 ~ it.skip ~ stakingBalanceBefore:", stakingBalanceBefore)
                const testBalanceBefore = await DOTCall.balanceOf(TestASinger.address)
                await TestAStakingCall.claimRewards(poolId)
                stakingBalanceAfter = await DOTCall.balanceOf(PROXYCONTRACT as string)
                const testBalanceAfter = await DOTCall.balanceOf(TestASinger.address)
                // 输出上面的结果
                console.log(stakingBalanceBefore.toString(), stakingBalanceAfter.toString());
                console.log("🚀 ~ file: stakeLSDCase.test.ts:1315 ~ it.skip ~ stakingBalanceBefore:", stakingBalanceBefore)
                console.log(testBalanceBefore.toString(), testBalanceAfter.toString());
                expect(stakingBalanceBefore.eq(stakingBalanceAfter.add(testRewards))).true
                console.log("🚀 ~ file: stakeLSDCase.test.ts:1318 ~ it.skip ~ stakingBalanceBefore:", stakingBalanceBefore)
                expect(testBalanceBefore.eq(testBalanceAfter.sub(testRewards))).true
                expect((await TestAStakingCall.earned(poolId, TestASinger.address, DOT as string)).eq(testDeduction.mul(testShare).div(totalShare))).true
                expect((await AliceStakingCall.earned(poolId, AliceSigner.address, DOT as string)).eq(aliceEarnedAfterClaim.add(testDeduction.mul(aliceShare).div(totalShare)))).true
            })

            // pass 用户claim=0，钱全部回到earned中 但是会有点精度丢失510156
            it("设置灼烧奖励为100%", async () => {
                const _deductionRate = "1000000000000000000"
                await AliceStakingCall.setRewardsDeductionRate(poolId, _deductionRate)
                expect((await AliceStakingCall.rewardsDeductionRates(poolId)).eq(_deductionRate)).true

                let shares: ethers.BigNumber = await AliceStakingCall.shares(poolId, AliceSigner.address)
                let earned = await AliceStakingCall.earned(poolId, AliceSigner.address, DOT as string)
                if (earned.isZero()) {
                    if (shares.isZero()) {
                        await AliceStakingCall.stake(poolId, amount)
                        expect((await AliceStakingCall.shares(poolId, AliceSigner.address)).eq(amount)).true
                        shares = ethers.BigNumber.from(amount)
                    }
                    await (await AliceStakingCall.updateRewardRule(poolId, DOT as string, _rewardRate, passedEndTime)).wait(1)
                    earned = await AliceStakingCall.earned(poolId, AliceSigner.address, DOT as string)
                }

                const deduction = earned.mul(_deductionRate).div("1000000000000000000")
                const rewards = earned.sub(deduction)
                console.log(earned.toString(), deduction.toString(), rewards.toString());
                
                const stakingBalanceBefore = await DOTCall.balanceOf(PROXYCONTRACT as string)
                const aliceBalanceBefore = await DOTCall.balanceOf(AliceSigner.address)
                
                await AliceStakingCall.claimRewards(poolId)

                const stakingBalanceAfter = await DOTCall.balanceOf(PROXYCONTRACT as string)
                const aliceBalanceAfter = await DOTCall.balanceOf(AliceSigner.address)

                expect(stakingBalanceBefore.eq(stakingBalanceAfter.add(rewards))).true
                expect(aliceBalanceBefore.eq(aliceBalanceAfter.sub(rewards))).true
                console.log((await AliceStakingCall.earned(poolId, AliceSigner.address, DOT as string)).toString());
                
                expect((await AliceStakingCall.earned(poolId, AliceSigner.address, DOT as string)).eq(deduction)).true
            })

            // pass 灼烧奖励少到不计数
            it.skip("设置灼烧奖励为1e-18", async () => {
                const _deductionRate = "1"
                await AliceStakingCall.setRewardsDeductionRate(poolId, _deductionRate)
                expect((await AliceStakingCall.rewardsDeductionRates(poolId)).eq(_deductionRate)).true

                let shares: ethers.BigNumber = await AliceStakingCall.shares(poolId, AliceSigner.address)
                let earned = await AliceStakingCall.earned(poolId, AliceSigner.address, DOT as string)
                if (earned.isZero()) {
                    if (shares.isZero()) {
                        await AliceStakingCall.stake(poolId, amount)
                        expect((await AliceStakingCall.shares(poolId, AliceSigner.address)).eq(amount)).true
                        shares = ethers.BigNumber.from(amount)
                    }
                    const currentBlockNumber = await provider.getBlockNumber()
                    const { timestamp } = await provider.getBlock(currentBlockNumber);
                    const endTime = timestamp + 180
                    await (await AliceStakingCall.updateRewardRule(poolId, DOT as string, _rewardRate, endTime)).wait(1)
                    earned = await AliceStakingCall.earned(poolId, AliceSigner.address, DOT as string)
                }

                const deduction = earned.mul(_deductionRate).div("1000000000000000000")
                const rewards = earned.sub(deduction)
                console.log(deduction.toString(), rewards.toString());
                
                const stakingBalanceBefore = await DOTCall.balanceOf(PROXYCONTRACT as string)
                console.log("🚀 ~ file: stakeLSDCase.test.ts:1385 ~ it.skip ~ stakingBalanceBefore:", stakingBalanceBefore)
                const aliceBalanceBefore = await DOTCall.balanceOf(AliceSigner.address)
                
                await AliceStakingCall.claimRewards(poolId)

                const stakingBalanceAfter = await DOTCall.balanceOf(PROXYCONTRACT as string)
                const aliceBalanceAfter = await DOTCall.balanceOf(AliceSigner.address)

                expect(stakingBalanceBefore.eq(stakingBalanceAfter.add(rewards))).true
                console.log("🚀 ~ file: stakeLSDCase.test.ts:1394 ~ it.skip ~ stakingBalanceBefore:", stakingBalanceBefore)
                expect(aliceBalanceBefore.eq(aliceBalanceAfter.sub(rewards))).true
                expect((await AliceStakingCall.earned(poolId, AliceSigner.address, DOT as string)).eq(deduction)).true
            })

            // pass
            it.skip("设置灼烧奖励为0", async () => {
                const _deductionRate = 0
                await AliceStakingCall.setRewardsDeductionRate(poolId, _deductionRate)
                expect((await AliceStakingCall.rewardsDeductionRates(poolId)).isZero()).true

                let shares: ethers.BigNumber = await AliceStakingCall.shares(poolId, AliceSigner.address)
                let earned = await AliceStakingCall.earned(poolId, AliceSigner.address, DOT as string)
                if (earned.isZero()) {
                    if (shares.isZero()) {
                        await AliceStakingCall.stake(poolId, amount)
                        expect((await AliceStakingCall.shares(poolId, AliceSigner.address)).eq(amount)).true
                        shares = ethers.BigNumber.from(amount)
                    }
                    const currentBlockNumber = await provider.getBlockNumber()
                    const { timestamp } = await provider.getBlock(currentBlockNumber);
                    const endTime = timestamp + 180
                    await (await AliceStakingCall.updateRewardRule(poolId, DOT as string, _rewardRate, endTime)).wait(1)
                    earned = await AliceStakingCall.earned(poolId, AliceSigner.address, DOT as string)
                }

                const stakingBalanceBefore = await DOTCall.balanceOf(PROXYCONTRACT as string)
                console.log("🚀 ~ file: stakeLSDCase.test.ts:1418 ~ it.skip ~ stakingBalanceBefore:", stakingBalanceBefore)
                const aliceBalanceBefore = await DOTCall.balanceOf(AliceSigner.address)
                
                await AliceStakingCall.claimRewards(poolId)

                const stakingBalanceAfter = await DOTCall.balanceOf(PROXYCONTRACT as string)
                const aliceBalanceAfter = await DOTCall.balanceOf(AliceSigner.address)

                expect(stakingBalanceBefore.eq(stakingBalanceAfter.add(earned))).true
                console.log("🚀 ~ file: stakeLSDCase.test.ts:1427 ~ it.skip ~ stakingBalanceBefore:", stakingBalanceBefore)
                expect(aliceBalanceBefore.eq(aliceBalanceAfter.sub(earned))).true
                expect((await AliceStakingCall.earned(poolId, AliceSigner.address, DOT as string)).isZero()).true
            })
        })

        // TODO done 5 todo
        describe.skip("转化池子 convertLSDPool", () => {
            let ACAPoolId: number = 25
            let DOTPoolId: number = 26
            let LDOTPoolId: number = 27
            let SADOTPoolId: number = 28
            let LCDOTPoolId: number = 29
            let LCDOT2LDOTPool: number = 76
            let LCDOT2TDOTPool: number = 32
            let DOT2LDOTPool: number = 33
            let DOT2TDOTPool: number = 79
            let LCDOT2WTDOTPool: number = 78
            let DOT2WTDOTPool: number = 77

            // before(async () => {
            //     let poolIndex = Number((await AliceStakingCall.PoolIndex()).toString())
                
            //     // await AliceStakingCall.addPool(ACA as string)
            //     // ACAPoolId = poolIndex++
            //     // await AliceStakingCall.addPool(DOT as string)
            //     // DOTPoolId = poolIndex++
            //     // await AliceStakingCall.addPool(LDOT as string)
            //     // LDOTPoolId = poolIndex++
            //     // await AliceStakingCall.addPool(SA_DOT as string)
            //     // SADOTPoolId = poolIndex++
            //     // await AliceStakingCall.addPool(LCDOT_13 as string)
            //     // LCDOTPoolId = poolIndex++
            //     console.log(ACAPoolId, DOTPoolId, LDOTPoolId, SADOTPoolId, LCDOTPoolId);

            //     // await AliceStakingCall.stake(ACAPoolId, amount)
            //     // await AliceStakingCall.stake(DOTPoolId, amount)
            //     // await AliceStakingCall.stake(LDOTPoolId, amount)
            //     // await AliceStakingCall.stake(SADOTPoolId, amount)
            //     // await AliceStakingCall.stake(LCDOTPoolId, amount)
            // })

            // FIXME 按理应该提示PoolNotExist
            it.skip("池子不存在时转化 => should reject", async () => {
                await expectRevert(AliceStakingCall.convertLSDPool(999, ConvertType.DOT2LDOT), PoolIsEmpty)
            })

            // pass
            it.skip("池子已经转化过 再次转化 => should reject already converted", async () => {
                const poolIndex = await AliceStakingCall.PoolIndex()
                await AliceStakingCall.addPool(DOT as string)
                await AliceStakingCall.stake(poolIndex, amount)

                await AliceStakingCall.convertLSDPool(poolIndex, ConvertType.DOT2LDOT)
                const { convertedShareType } = await AliceStakingCall.convertInfos(poolIndex)
                expect(convertedShareType).eq(LDOT)

                await expectRevert(AliceStakingCall.convertLSDPool(poolIndex, ConvertType.DOT2LDOT), AlreadyConverted)
            })

            // pass
            it.skip("池子total share = 0 时转化 => should reject pool is empty", async () => {
                const poolIndex = await AliceStakingCall.PoolIndex()
                await AliceStakingCall.addPool(DOT as string)
                await expectRevert(AliceStakingCall.convertLSDPool(poolIndex, ConvertType.DOT2LDOT), PoolIsEmpty)
            })

            // pass
            it.skip("ACA 池子 convert 成其他池子 => should reject", async () => {
                await expectRevert(AliceStakingCall.convertLSDPool(ACAPoolId, ConvertType.DOT2LDOT), ShareTokenMustDOT)
                await expectRevert(AliceStakingCall.convertLSDPool(ACAPoolId, ConvertType.DOT2TDOT), ShareTokenMustDOT)
                await expectRevert(AliceStakingCall.convertLSDPool(ACAPoolId, ConvertType.LCDOT2LDOT), ShareTokenMustLcDOT)
                await expectRevert(AliceStakingCall.convertLSDPool(ACAPoolId, ConvertType.LCDOT2TDOT), ShareTokenMustLcDOT)
            })

            // pass
            it.skip("DOT 池子 调用LCDOT convert的方法 => should reject", async () => {
                await expectRevert(AliceStakingCall.convertLSDPool(DOTPoolId, ConvertType.LCDOT2LDOT), ShareTokenMustLcDOT)
                await expectRevert(AliceStakingCall.convertLSDPool(DOTPoolId, ConvertType.LCDOT2TDOT), ShareTokenMustLcDOT)
            })

            // pass
            it.skip("LDOT 池子 convert 成其他池子 => should reject", async () => {
                await expectRevert(AliceStakingCall.convertLSDPool(LDOTPoolId, ConvertType.DOT2LDOT), ShareTokenMustDOT)
                await expectRevert(AliceStakingCall.convertLSDPool(LDOTPoolId, ConvertType.DOT2TDOT), ShareTokenMustDOT)
                await expectRevert(AliceStakingCall.convertLSDPool(LDOTPoolId, ConvertType.LCDOT2LDOT), ShareTokenMustLcDOT)
                await expectRevert(AliceStakingCall.convertLSDPool(LDOTPoolId, ConvertType.LCDOT2TDOT), ShareTokenMustLcDOT)
            })

            // TODO SADOT 没钱
            it.skip("SADOT 池子 convert 成其他池子 => should reject", async () => {
                await expectRevert(AliceStakingCall.convertLSDPool(SADOTPoolId, ConvertType.DOT2LDOT), ShareTokenMustDOT)
                await expectRevert(AliceStakingCall.convertLSDPool(SADOTPoolId, ConvertType.DOT2TDOT), ShareTokenMustDOT)
                await expectRevert(AliceStakingCall.convertLSDPool(SADOTPoolId, ConvertType.LCDOT2LDOT), ShareTokenMustLcDOT)
                await expectRevert(AliceStakingCall.convertLSDPool(SADOTPoolId, ConvertType.LCDOT2TDOT), ShareTokenMustLcDOT)
            })

            // pass
            it.skip("LCDOT 池子 调用DOT convert的方法 => should reject", async () => {
                await expectRevert(AliceStakingCall.convertLSDPool(LCDOTPoolId, ConvertType.DOT2LDOT), ShareTokenMustDOT)
                await expectRevert(AliceStakingCall.convertLSDPool(LCDOTPoolId, ConvertType.DOT2TDOT), ShareTokenMustDOT)
            })

            it.skip("LCDOT2LDOT 后 stake、unstake功能正常", async () => {
                const poolIndex = await AliceStakingCall.PoolIndex()
                console.log("LCDOT2LDOT:", poolIndex.toString())
                await AliceStakingCall.addPool(LCDOT_13 as string)
                // const stakeTx = await AliceStakingCall.stake(LCDOT2LDOTPool, amount)
                // console.log(stakeTx);
                
                // await checkStake(stakeTx.hash, LCDOT2LDOTPool, LCDOT_13 as string, amount)
                await checkStake("0x1e43e88c8626edf49fb2368ef77b5cf6cb5fefee2aa7a454f420c79b20ea8e2e", LCDOT2LDOTPool, LCDOT_13 as string, amount)
                const tx = await AliceStakingCall.convertLSDPool(poolIndex, ConvertType.LCDOT2LDOT)
                await checkConvertLSDPool(tx.hash, poolIndex, ConvertType.LCDOT2LDOT)

                const stakeTx = await AliceStakingCall.stake(poolIndex, amount)
                console.log("stakeTx", stakeTx);
                await checkStake(stakeTx.hash, poolIndex, LCDOT_13 as string, amount)
                
                const unstakeTx = await AliceStakingCall.unstake(poolIndex, amount)
                console.log("unstakeTx", unstakeTx);
                await checkUnstake(unstakeTx.hash, poolIndex, LCDOT_13 as string, amount)

            })

            it("LCDOT2TDOT 后 stake、unstake功能正常", async () => {
                const poolIndex = await AliceStakingCall.PoolIndex()
                console.log("LCDOT2TDOT:", poolIndex.toString())
                await AliceStakingCall.addPool(LCDOT_13 as string)
                const stakeTxBefore = await AliceStakingCall.stake(poolIndex, amount)
                await checkStake(stakeTxBefore.hash, poolIndex, LCDOT_13 as string, amount)
                const tx = await AliceStakingCall.convertLSDPool(poolIndex, ConvertType.LCDOT2TDOT)
                await checkConvertLSDPool(tx.hash, poolIndex, ConvertType.LCDOT2TDOT)

                const stakeTx = await AliceStakingCall.stake(poolIndex, amount)
                console.log("stakeTx", stakeTx);
                await checkStake(stakeTx.hash, poolIndex, LCDOT_13 as string, amount)
                
                const unstakeTx = await AliceStakingCall.unstake(poolIndex, amount)
                console.log("unstakeTx", unstakeTx);
                await checkUnstake(unstakeTx.hash, poolIndex, LCDOT_13 as string, amount)
            })

            it("DOT2LDOT 后 stake、unstake功能正常", async () => {
                const poolIndex = await AliceStakingCall.PoolIndex()
                console.log("DOT2LDOT:", poolIndex.toString())
                await AliceStakingCall.addPool(DOT as string)
                const stakeTxBefore = await AliceStakingCall.stake(poolIndex, amount)
                await checkStake(stakeTxBefore.hash, poolIndex, DOT as string, amount)
                const tx = await AliceStakingCall.convertLSDPool(poolIndex, ConvertType.DOT2LDOT)
                await checkConvertLSDPool(tx.hash, poolIndex, ConvertType.DOT2LDOT)
                // await checkConvertLSDPool("0x8163420abda87cdd2b84d9e2c0fbbe3a6fd1b6ea0d1814991cc99b29c63a5e3c", poolIndex, ConvertType.DOT2LDOT)

                const stakeTx = await AliceStakingCall.stake(poolIndex, amount)
                console.log("stakeTx", stakeTx);
                await checkStake(stakeTx.hash, poolIndex, DOT as string, amount)
                // await checkStake("0x31d62ef8bf26c7e4a89b1f08d5953c42440236cdf5e56e27dfeffe82044a81d6", poolIndex, DOT as string, amount)
                
                const unstakeTx = await AliceStakingCall.unstake(poolIndex, amount)
                console.log("unstakeTx", unstakeTx);
                await checkUnstake(unstakeTx.hash, poolIndex, DOT as string, amount)
                // await checkUnstake("0x82164ebcf304b315f0c8c7edc8007425fc6c2fb283be291d51d3185d4e98d034", poolIndex, DOT as string, amount)
            })

            // pass id=79
            it.skip("DOT2TDOT 后 stake、unstake功能正常", async () => {
                const poolIndex = await AliceStakingCall.PoolIndex()
                console.log("DOT2TDOT:", poolIndex.toString())
                await AliceStakingCall.addPool(DOT as string)
                const stakeTxBefore = await AliceStakingCall.stake(poolIndex, amount)
                await checkStake(stakeTxBefore.hash, poolIndex, DOT as string, amount)
                const tx = await AliceStakingCall.convertLSDPool(poolIndex, ConvertType.DOT2TDOT)
                await checkConvertLSDPool(tx.hash, poolIndex, ConvertType.DOT2TDOT)
                // await checkConvertLSDPool("0x8163420abda87cdd2b84d9e2c0fbbe3a6fd1b6ea0d1814991cc99b29c63a5e3c", poolIndex, ConvertType.DOT2TDOT)

                const stakeTx = await AliceStakingCall.stake(poolIndex, amount)
                console.log("stakeTx", stakeTx);
                await checkStake(stakeTx.hash, poolIndex, DOT as string, amount)
                // await checkStake("0x31d62ef8bf26c7e4a89b1f08d5953c42440236cdf5e56e27dfeffe82044a81d6", poolIndex, DOT as string, amount)
                
                const unstakeTx = await AliceStakingCall.unstake(poolIndex, amount)
                console.log("unstakeTx", unstakeTx);
                await checkUnstake(unstakeTx.hash, poolIndex, DOT as string, amount)
                // await checkUnstake("0x82164ebcf304b315f0c8c7edc8007425fc6c2fb283be291d51d3185d4e98d034", poolIndex, DOT as string, amount)
            })

            // pass id=78
            it.skip("LCDOT2WTDOT 后 stake、unstake正常", async () => {
                const poolIndex = await AliceStakingCall.PoolIndex()
                console.log("LCDOT2WTDOT:", poolIndex.toString())
                await AliceStakingCall.addPool(LCDOT_13 as string)
                const stakeTxBefore = await AliceStakingCall.stake(poolIndex, amount)
                await checkStake(stakeTxBefore.hash, poolIndex, LCDOT_13 as string, amount)
                const tx = await AliceStakingCall.convertLSDPool(poolIndex, ConvertType.LCDOT2WTDOT)
                await checkConvertLSDPool(tx.hash, poolIndex, ConvertType.LCDOT2WTDOT)
                // await checkConvertLSDPool("0x8163420abda87cdd2b84d9e2c0fbbe3a6fd1b6ea0d1814991cc99b29c63a5e3c", poolIndex, ConvertType.LCDOT2WTDOT)

                const stakeTx = await AliceStakingCall.stake(poolIndex, amount)
                console.log("stakeTx", stakeTx);
                await checkStake(stakeTx.hash, poolIndex, LCDOT_13 as string, amount)
                // await checkStake("0x973e22fce87ce37b12f1104b59b5e69113a78bba32ca8babb56daee95d3b5dd6", poolIndex, LCDOT_13 as string, amount)
                
                const unstakeTx = await AliceStakingCall.unstake(poolIndex, amount)
                console.log("unstakeTx", unstakeTx);
                await checkUnstake(unstakeTx.hash, poolIndex, LCDOT_13 as string, amount)
                // await checkUnstake("0xb8b4cdc63a0a3d13f41c40e0ef74abd3f7f6e65e6986dd0e2deb67f79753c6cd", poolIndex, LCDOT_13 as string, amount)
            })

            // pass id=77
            it.skip("DOT2WTDOT 后 stake、unstake功能正常", async () => {
                const poolIndex = await AliceStakingCall.PoolIndex()
                console.log("🚀 ~ file: stakeLSDCase.test.ts:1860 ~ it ~ poolIndex:", poolIndex.toString())
                await AliceStakingCall.addPool(DOT as string)
                const stakeTxBefore = await AliceStakingCall.stake(poolIndex, amount)
                await checkStake(stakeTxBefore.hash, poolIndex, DOT as string, amount)
                const tx = await AliceStakingCall.convertLSDPool(poolIndex, ConvertType.DOT2WTDOT)
                await checkConvertLSDPool(tx.hash, poolIndex, ConvertType.DOT2WTDOT)
                
                // await checkConvertLSDPool("0x8163420abda87cdd2b84d9e2c0fbbe3a6fd1b6ea0d1814991cc99b29c63a5e3c", poolIndex, ConvertType.LCDOT2WTDOT)

                const stakeTx = await AliceStakingCall.stake(poolIndex, amount)
                console.log(stakeTx);
                await checkStake(stakeTx.hash, poolIndex, DOT as string, amount)
                // await checkStake("0xbf487888b078d6fa0ee62295a25b4b714b2946899ba754ffed1a4b90aebe64f6", poolIndex, DOT as string, amount)
                
                const unstakeTx = await AliceStakingCall.unstake(poolIndex, amount)
                console.log(unstakeTx);
                await checkUnstake(unstakeTx.hash, poolIndex, DOT as string, amount)
                // await checkUnstake("0x2d14438f6937d3cebde01e700d7f3a0dd81a2169cffe196afb42a7777b01f5ed", poolIndex, DOT as string, amount)
            })

        })

        // done
        describe.skip("暂停合同 pause/unpause", () => {
            let paused = false

            before("首先检查合同状态", async () => {
                paused = await AliceStakingCall.paused()
            })

            after("恢复合同状态", async () => {
                if(paused) {
                    // 恢复合同
                    await AliceStakingCall.unpause()
                    expect(await AliceStakingCall.paused()).to.be.false
                }
            })

            it.skip("暂停池子后 无法进行除转让权限外的任何交易. cannot call function after pool paused => should reject", async () => {
                if (!paused) {
                    await AliceStakingCall.pause()
                    expect(await AliceStakingCall.paused()).to.be.true
                    paused = true
                }
                await expectRevert(AliceStakingCall.addPool(DOT as string), AlreadyPaused)
                await expectRevert(AliceStakingCall.stake(poolId, amount), AlreadyPaused)
                await expectRevert(AliceStakingCall.unstake(poolId, amount), AlreadyPaused)
                await expectRevert(AliceStakingCall.updateRewardRule(poolId, DOT as string, amount, 2000), AlreadyPaused)
                await expectRevert(AliceStakingCall.claimRewards(poolId), AlreadyPaused)
                await expectRevert(AliceStakingCall.convertLSDPool(poolId, ConvertType.DOT2LDOT), AlreadyPaused)
                await expectRevert(AliceStakingCall.setRewardsDeductionRate(poolId, '1000000000000000000'), AlreadyPaused)
                await expectRevert(AliceStakingCall.exit(poolId), AlreadyPaused)
                await expectRevert(AliceStakingCall.setPoolOperationPause(poolId, Operation.Stake, true), AlreadyPaused)
            })

            it.skip("暂停合同后不可再次暂停 => should reject", async () => {
                if (!paused) {
                    await AliceStakingCall.pause()
                }
                await expectRevert(AliceStakingCall.pause(), AlreadyPaused)
            })

            it.skip("暂停合同后依旧可以转让owner => should success", async () => {
                await AliceStakingCall.transferOwnership(TestASinger.address)
                expect(await TestAStakingCall.owner()).equal(TestASinger.address)
                await TestAStakingCall.transferOwnership(AliceSigner.address)
                expect(await AliceStakingCall.owner()).equal(AliceSigner.address)
            })

            it("未暂停的合同不可重复设置未暂停状态 => should reject", async () => {
                if (paused) {
                    await AliceStakingCall.unpause()
                    paused = false
                }
                await expectRevert(AliceStakingCall.unpause(), NotPaused)
            })
        })
    })
})