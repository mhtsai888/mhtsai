import { collection, doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from './firebase';

const menuData = [
  // 百年老舖
  { id: 'item-1', category: '百年老舖', name: '百年仙草干茶', priceM: 40, priceL: 45 },
  { id: 'item-2', category: '百年老舖', name: '百年仙草凍飲', priceM: 45, priceL: 50, isRecommended: true },
  { id: 'item-3', category: '百年老舖', name: '冬瓜仙草茶', priceM: 40, priceL: 45 },
  { id: 'item-4', category: '百年老舖', name: '甘蔗仙草茶', priceM: 65, priceL: 75, isRecommended: true },
  { id: 'item-5', category: '百年老舖', name: '仙草凍奶茶', priceM: 50, priceL: 55 },
  { id: 'item-6', category: '百年老舖', name: '仙草凍紅茶拿鐵', priceM: 55, priceL: 65 },
  { id: 'item-7', category: '百年老舖', name: '特濃仙草茶(無糖)罐裝1000ml', priceSingle: 70 },
  { id: 'item-8', category: '百年老舖', name: '百年仙草茶葉蛋', priceSingle: 15 },

  // 經典老味道
  { id: 'item-9', category: '經典老味道', name: '冰釀洛神茶', priceM: 30, priceL: 35 },
  { id: 'item-10', category: '經典老味道', name: '懷舊冬瓜茶', priceM: 30, priceL: 35 },
  { id: 'item-11', category: '經典老味道', name: '青檸冬瓜茶', priceM: 35, priceL: 45 },
  { id: 'item-12', category: '經典老味道', name: '仙楂烏梅汁', priceM: 40, priceL: 45 },
  { id: 'item-13', category: '經典老味道', name: '青檸蜜茶', priceM: 40, priceL: 50, isRecommended: true },

  // 茶拿鐵
  { id: 'item-14', category: '茶拿鐵', name: '經典紅茶拿鐵', priceM: 50, priceL: 55 },
  { id: 'item-15', category: '茶拿鐵', name: '黃金蕎麥拿鐵', priceM: 60, priceL: 70, isRecommended: true },
  { id: 'item-16', category: '茶拿鐵', name: '懷舊冬瓜拿鐵', priceM: 55, priceL: 65 },
  { id: 'item-17', category: '茶拿鐵', name: '鮮萃甘蔗拿鐵', priceM: 75, priceL: 85 },
  { id: 'item-18', category: '茶拿鐵', name: '白玉珍珠紅茶拿鐵', priceM: 55, priceL: 60 },
  { id: 'item-19', category: '茶拿鐵', name: '小粉圓紅茶拿鐵', priceM: 55, priceL: 60 },

  // 原茶
  { id: 'item-20', category: '原茶', name: '高山金萱', priceM: 25, priceL: 30 },
  { id: 'item-21', category: '原茶', name: '蜜香紅茶', priceM: 25, priceL: 30 },
  { id: 'item-22', category: '原茶', name: '初芽綠茶', priceM: 25, priceL: 30 },
  { id: 'item-23', category: '原茶', name: '安溪烏龍', priceM: 25, priceL: 30 },
  { id: 'item-24', category: '原茶', name: '經典復刻紅茶', priceM: 30, priceL: 35 },
  { id: 'item-25', category: '原茶', name: '黃金蕎麥茶', priceM: 35, priceL: 40, isRecommended: true },
];

export async function seedMenu() {
  for (const item of menuData) {
    const { id, ...data } = item;
    const ref = doc(collection(db, 'menuItems'), id);
    await setDoc(ref, {
      ...data,
      createdAt: serverTimestamp()
    });
  }
}
