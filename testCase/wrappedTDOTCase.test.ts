import {expect, use} from 'chai';
import { ethers } from "ethers";
import { AcalaJsonRpcProvider } from "@acala-network/eth-providers";
import { solidity } from 'ethereum-waffle';
import { SA_DOT, ALICE_ETH, WTDOT, MAX_UINT_AMOUNT } from "../utils/config";
import { IERC20Call } from '../call/IERC20Call';
import { IWrappedTDOTCall } from "../call/IWrappedTDOT";
import { BalanceLow, InsufficientAllowance, InvalidTDOT, InvalidWTDOT, WTDOTNotEnough } from '../utils/error';
import { expectRevert } from '../utils/expectRevert';

use(solidity);

describe('WrappedTDOT 合约测试', () => {
    const provider = new AcalaJsonRpcProvider(
        "https://crosschain-dev.polkawallet.io:9909"
    );
    const AliceSigner = new ethers.Wallet(ALICE_ETH as string, provider)
    const iWrappedTDOTCall = new IWrappedTDOTCall(AliceSigner)
    const iWTDOTCall = new IERC20Call(WTDOT as string, AliceSigner)
    const iTDOTCall = new IERC20Call(SA_DOT as string, AliceSigner)
    const amount = ethers.BigNumber.from("1000000000000") // 1e12

    // before(async () => {
    //     await iTDOTCall.approve(WTDOT as string, MAX_UINT_AMOUNT)
    //     expect((await iTDOTCall.allowance(AliceSigner.address, WTDOT as string)).eq(MAX_UINT_AMOUNT))
    // })

    // pass
    it.skip("deposit 当用户tdot未approve=0时 => should reject ", async () => {
        await iTDOTCall.approve(WTDOT as string, 0)
        expect((await iTDOTCall.allowance(AliceSigner.address, WTDOT as string)).isZero())
        await expectRevert(iWrappedTDOTCall.deposit(amount), InsufficientAllowance)
    })

    // pass
    it.skip("deposit 当用户tdot approval<deposit amount时 => should reject", async () => {
        await iTDOTCall.approve(WTDOT as string, amount.sub(1))
        expect((await iTDOTCall.allowance(AliceSigner.address, WTDOT as string)).isZero())
        await expectRevert(iWrappedTDOTCall.deposit(amount), InsufficientAllowance)
    })

    // pass
    it.skip("deposit 当deposit amount > 用户balance时 => should reject", async () => {
        const aliceBalance = await iTDOTCall.balanceOf(AliceSigner.address)
        await expectRevert(iWrappedTDOTCall.deposit(aliceBalance.add(1)), BalanceLow)
    })

    // pass
    it.skip("deposit 当deposit amount=0时 => should reject WTDOT: invalid WTDOT amount", async () => {
        await expectRevert(iWrappedTDOTCall.deposit(0), InvalidWTDOT)
    })

    // pass
    it.skip("deposit 功能测试", async () => {
        const [depositRateBefore, aliceTDOTBefore, aliceWTDOTBefore, WrappedTDOTBefore, WTDOTTotalSupplyBefore] = await Promise.all([
            iWrappedTDOTCall.depositRate(),
            iTDOTCall.balanceOf(AliceSigner.address),
            iWTDOTCall.balanceOf(AliceSigner.address),
            iTDOTCall.balanceOf(WTDOT as string),
            iWTDOTCall.totalSupply()
        ])
        console.log(depositRateBefore.toString(), aliceTDOTBefore.toString(), aliceWTDOTBefore.toString(), WrappedTDOTBefore.toString(), WTDOTTotalSupplyBefore.toString())
        const expectWTDOT = amount.mul(depositRateBefore).div("1000000000000000000");
        await iWrappedTDOTCall.deposit(amount)
        const [depositRateAfter, aliceTDOTAfter, aliceWTDOTAfter, WrappedTDOTAfter, WTDOTTotalSupplyAfter] = await Promise.all([
            iWrappedTDOTCall.depositRate(),
            iTDOTCall.balanceOf(AliceSigner.address),
            iWTDOTCall.balanceOf(AliceSigner.address),
            iTDOTCall.balanceOf(WTDOT as string),
            iWTDOTCall.totalSupply()
        ])
        console.log(depositRateAfter.toString(), aliceTDOTAfter.toString(), aliceWTDOTAfter.toString(), WrappedTDOTAfter.toString(), WTDOTTotalSupplyAfter.toString())
        // deposit rate 应该不受影响
        expect(depositRateBefore.eq(depositRateAfter)).true
        // alice的TDOT应该 = balance - amount
        expect(aliceTDOTBefore.eq(aliceTDOTAfter.add(amount))).true
        // alice的WTDOT应该 = balance + expectWTDOT
        expect(aliceWTDOTBefore.eq(aliceWTDOTAfter.sub(expectWTDOT))).true
        // WrappedTDOT合约的TDOT应该 = balance + amount
        expect(WrappedTDOTBefore.eq(WrappedTDOTAfter.sub(amount))).true
        // WTDOT的供应量应该 = totalSupply + expectWTDOT
        expect(WTDOTTotalSupplyBefore.eq(WTDOTTotalSupplyAfter.sub(expectWTDOT))).true
    })

    // pass
    it.skip("withdraw 当withdraw amount=0时 => should reject WTDOT: invalid TDOT amount", async () => {
        const wtDOTBalance = await iWTDOTCall.balanceOf(AliceSigner.address)
        if (!wtDOTBalance.isZero()) {
            await iWrappedTDOTCall.withdraw(wtDOTBalance)
        }
        await expectRevert(iWrappedTDOTCall.withdraw(0), InvalidTDOT)
    })

    // pass
    it.skip("withdraw 当withdraw amount>deposit amount时 => should reject WTDOT: WTDOT not enough", async () => {
        const wtDOTBalance = await iWTDOTCall.balanceOf(AliceSigner.address)
        await expectRevert(iWrappedTDOTCall.withdraw(wtDOTBalance.add(1)), WTDOTNotEnough)
    })

    // pass
    it.skip("withdraw 当withdraw amount<deposit amount时", async () => {
        const [withdrawRateBefore, aliceTDOTBefore, aliceWTDOTBefore, WrappedTDOTBefore, WTDOTTotalSupplyBefore] = await Promise.all([
            iWrappedTDOTCall.withdrawRate(),
            iTDOTCall.balanceOf(AliceSigner.address),
            iWTDOTCall.balanceOf(AliceSigner.address),
            iTDOTCall.balanceOf(WTDOT as string),
            iWTDOTCall.totalSupply()
        ])
        console.log(withdrawRateBefore.toString(), aliceTDOTBefore.toString(), aliceWTDOTBefore.toString(), WrappedTDOTBefore.toString(), WTDOTTotalSupplyBefore.toString())
        const withdrawAmount = aliceWTDOTBefore.div(2)
        const expectTDOT = withdrawAmount.mul(withdrawRateBefore).div("1000000000000000000");
        await iWrappedTDOTCall.withdraw(withdrawAmount)
        const [withdrawRateAfter, aliceTDOTAfter, aliceWTDOTAfter, WrappedTDOTAfter, WTDOTTotalSupplyAfter] = await Promise.all([
            iWrappedTDOTCall.withdrawRate(),
            iTDOTCall.balanceOf(AliceSigner.address),
            iWTDOTCall.balanceOf(AliceSigner.address),
            iTDOTCall.balanceOf(WTDOT as string),
            iWTDOTCall.totalSupply()
        ])
        console.log(withdrawRateAfter.toString(), aliceTDOTAfter.toString(), aliceWTDOTAfter.toString(), WrappedTDOTAfter.toString(), WTDOTTotalSupplyAfter.toString())
        // withdraw rate 应该不受影响
        expect(withdrawRateBefore.eq(withdrawRateAfter)).true
        // alice的TDOT应该 = balance + expectTDOT
        expect(aliceTDOTBefore.eq(aliceTDOTAfter.sub(expectTDOT))).true
        // alice的WTDOT应该 = balance - withdrawAmount
        expect(aliceWTDOTBefore.eq(aliceWTDOTAfter.add(withdrawAmount))).true
        // WrappedTDOT合约的TDOT应该 = balance - amount
        expect(WrappedTDOTBefore.eq(WrappedTDOTAfter.add(expectTDOT))).true
        // WTDOT的供应量应该 = totalSupply - expectTDOT
        expect(WTDOTTotalSupplyBefore.eq(WTDOTTotalSupplyAfter.add(expectTDOT))).true
    })

    // pass
    it.skip("withdraw 当withdraw amount=deposit amount时", async () => {
        const [withdrawRateBefore, aliceTDOTBefore, aliceWTDOTBefore, WrappedTDOTBefore, WTDOTTotalSupplyBefore] = await Promise.all([
            iWrappedTDOTCall.withdrawRate(),
            iTDOTCall.balanceOf(AliceSigner.address),
            iWTDOTCall.balanceOf(AliceSigner.address),
            iTDOTCall.balanceOf(WTDOT as string),
            iWTDOTCall.totalSupply()
        ])
        console.log(withdrawRateBefore.toString(), aliceTDOTBefore.toString(), aliceWTDOTBefore.toString(), WrappedTDOTBefore.toString(), WTDOTTotalSupplyBefore.toString())
        const withdrawAmount = aliceWTDOTBefore
        const expectTDOT = withdrawAmount.mul(withdrawRateBefore).div("1000000000000000000");
        await iWrappedTDOTCall.withdraw(withdrawAmount)
        const [withdrawRateAfter, aliceTDOTAfter, aliceWTDOTAfter, WrappedTDOTAfter, WTDOTTotalSupplyAfter] = await Promise.all([
            iWrappedTDOTCall.withdrawRate(),
            iTDOTCall.balanceOf(AliceSigner.address),
            iWTDOTCall.balanceOf(AliceSigner.address),
            iTDOTCall.balanceOf(WTDOT as string),
            iWTDOTCall.totalSupply()
        ])
        console.log(withdrawRateAfter.toString(), aliceTDOTAfter.toString(), aliceWTDOTAfter.toString(), WrappedTDOTAfter.toString(), WTDOTTotalSupplyAfter.toString())
        // withdraw rate 应该不受影响
        expect(withdrawRateBefore.eq(withdrawRateAfter)).true
        // alice的TDOT应该 = balance + expectTDOT
        expect(aliceTDOTBefore.eq(aliceTDOTAfter.sub(expectTDOT))).true
        // alice的WTDOT应该 = balance - withdrawAmount
        expect(aliceWTDOTBefore.eq(aliceWTDOTAfter.add(withdrawAmount))).true
        // WrappedTDOT合约的TDOT应该 = balance - amount
        expect(WrappedTDOTBefore.eq(WrappedTDOTAfter.add(expectTDOT))).true
        // WTDOT的供应量应该 = totalSupply - expectTDOT
        expect(WTDOTTotalSupplyBefore.eq(WTDOTTotalSupplyAfter.add(expectTDOT))).true
    })
})