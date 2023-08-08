import { ethers } from "ethers";
import UpgradeableStakingLSDABI from './UpgradeableStakingLSD.json'
import {PROXYCONTRACT} from "./utils/config";

// 连接到以太坊节点
const provider = new ethers.providers.JsonRpcProvider("https://crosschain-dev.polkawallet.io:9909");
const ProxyContract = new ethers.Contract(PROXYCONTRACT as any, UpgradeableStakingLSDABI, provider);

(async ()=>{
    try {
        const poolIndex = await ProxyContract.poolIndex();
        console.log('ProxyContract poolIndex:', poolIndex.toString());

        const liquid = await ProxyContract.LIQUID_CROWDLOAN();
        console.log('ProxyContract LIQUID_CROWDLOAN:', liquid);

        for (let i = 0; i < poolIndex; i++) {
            const shareType = await ProxyContract.shareTypes(i);
            const convertInfo = await ProxyContract.convertInfos(i);
            const rewardTypes = await ProxyContract.rewardTypes(i);
            const rewardsDeductionRates = await ProxyContract.rewardsDeductionRates(i);
            const totalShares = await ProxyContract.totalShares(i);

            console.log("=============================================================");
            console.log(`Pool#${i}`);
            console.log('shareTypes: ', shareType);
            console.log('totalShares: ', totalShares.toString());
            console.log('convert token: ', convertInfo.convertedShareType);
            console.log('convert exchange rate: ', convertInfo.convertedExchangeRate);
            console.log('rewardTypes: ', rewardTypes);
            console.log('rewardsDeductionRates: ', rewardsDeductionRates.toString());
        }
    } catch (error) {
        console.error('获取代币信息时出错:', error);
    }

})()

