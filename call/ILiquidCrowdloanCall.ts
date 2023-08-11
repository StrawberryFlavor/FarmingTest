import { ethers } from "ethers";
import { LIQUID_CROWDLOAN } from "../utils/config";
import { Amount, BlockNumber } from "../utils/type";

const liquidCrowdloanABI = [
    "function redeem(uint amount) returns (uint256)",
    "function getRedeemCurrency() view returns (address)"
]

const liquidCrowdloanIface = new ethers.utils.Interface(liquidCrowdloanABI)

export class ILiquidCrowdloanCall {
    liquidCrowdloanContracts: ethers.Contract
    constructor(provider: ethers.providers.JsonRpcProvider|ethers.Wallet) {
        this.liquidCrowdloanContracts = new ethers.Contract(
            LIQUID_CROWDLOAN as string,
            liquidCrowdloanABI,
            provider
        );
    }

    async getRedeemCurrency(blockTag: BlockNumber="latest") {
        return await this.liquidCrowdloanContracts.getRedeemCurrency({blockTag})
    }

    async redeem(amount: Amount) {
        const tx = await this.liquidCrowdloanContracts.redeem(amount)
        await tx.wait()

        return tx
    }

    redeemEncode(amount: Amount) {
        return liquidCrowdloanIface.encodeFunctionData("redeem", [amount])
    }
}