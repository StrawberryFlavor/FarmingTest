import { ethers } from "ethers";
import { UserAddress, ContractAddress, Amount, BlockNumber } from "../utils/type";
import { WTDOT } from "../utils/config"

export const wrappedTDOTABI = [
    "function depositRate() view returns (uint256)",
    "function withdrawRate() view returns (uint256)",
    "function deposit(uint tdotAmount) returns (uint256)",
    "function withdraw(uint wtdotAmount) returns (uint256)"
]

const wrappedTDOTIface = new ethers.utils.Interface(wrappedTDOTABI);

export class IWrappedTDOTCall {
    WrappedTDOTContract: ethers.Contract
    constructor(provider: ethers.providers.JsonRpcProvider | ethers.Wallet) {
        this.WrappedTDOTContract = new ethers.Contract(
            WTDOT as string,
            wrappedTDOTABI,
            provider
        );
    }


    async depositRate(blockTag: BlockNumber = "latest") {
        return await this.WrappedTDOTContract.depositRate({ blockTag })
    }

    async withdrawRate(blockTag: BlockNumber = "latest") {
        return await this.WrappedTDOTContract.withdrawRate({ blockTag })
    }

    async deposit(amount: Amount) {
        const tx = await this.WrappedTDOTContract.deposit(amount)
        await tx.wait()

        return tx
    }

    depositEncode(amount: Amount) {
        return wrappedTDOTIface.encodeFunctionData("deposit", [amount]);
    }

    async withdraw(amount: Amount) {
        const tx = await this.WrappedTDOTContract.withdraw(amount)
        await tx.wait()

        return tx
    }

    withdrawEncode(amount: Amount) {
        return wrappedTDOTIface.encodeFunctionData("withdraw", [amount]);
    }
}