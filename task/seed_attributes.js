/**
 * Seed script for common e-commerce attributes.
 * Run: node seed_attributes.js
 */
require('dotenv').config();
const { Sequelize, DataTypes } = require('sequelize');

const sequelize = new Sequelize('ecommerce', 'postgres', 'Joker0328', {
    host: 'localhost',
    dialect: 'postgres',
    logging: false,
});

const Attribute = sequelize.define('attribute', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    nameMn: { type: DataTypes.STRING, allowNull: false, field: 'name_mn' },
    values: { type: DataTypes.TEXT, allowNull: true },
}, {
    tableName: 'attributes',
    timestamps: true,
    underscored: true,
});

const COMMON_ATTRIBUTES = [
    // Storage / Capacity (Electronics)
    { name: 'Storage', nameMn: 'Хадгалах санах ой', values: '128GB,256GB,512GB,1TB,2TB,4TB,8TB' },
    { name: 'RAM', nameMn: 'Оперативн санах ой', values: '4GB,8GB,12GB,16GB,32GB,64GB' },
    // Size (Clothing & General)
    { name: 'Size', nameMn: 'Хэмжээ', values: 'XS,S,M,L,XL,XXL,XXXL,One Size' },
    { name: 'Shoe Size', nameMn: 'Гутлын хэмжээ', values: '35,36,37,38,39,40,41,42,43,44,45,46' },
    // Colors
    { name: 'Color', nameMn: 'Өнгө', values: 'Цагаан,Хар,Улаан,Цэнхэр,Ногоон,Шар,Ягаан,Нил ягаан,Саарал,Бор,Алтан,Мөнгөн' },
    // Material
    { name: 'Material', nameMn: 'Материал', values: 'Хөвөн,Полиэстер,Торго,Ноос,Загас,Арьс,Металл,Пластик,Мод,Шил' },
    // Weight
    { name: 'Weight', nameMn: 'Жин', values: '100g,250g,500g,1kg,2kg,5kg,10kg' },
    // Connectivity (Electronics)
    { name: 'Connectivity', nameMn: 'Холболт', values: 'Bluetooth,WiFi,USB-C,USB-A,HDMI,Lightning,NFC,5G,4G' },
    // Battery
    { name: 'Battery Capacity', nameMn: 'Батарейны багтаамж', values: '2000mAh,3000mAh,4000mAh,5000mAh,6000mAh,10000mAh' },
    // Screen Size (Electronics)
    { name: 'Screen Size', nameMn: 'Дэлгэцийн хэмжээ', values: '5",6",6.5",7",10",11",12",13",14",15",16",17",19",21",24",27",32",43"' },
    // Resolution
    { name: 'Resolution', nameMn: 'Нарийвчлал', values: 'HD,Full HD,2K,4K,8K' },
    // Voltage
    { name: 'Voltage', nameMn: 'Хүчдэл', values: '110V,220V,12V,24V' },
    // Style
    { name: 'Style', nameMn: 'Загвар', values: 'Casual,Formal,Sport,Vintage,Modern,Classic' },
    // Season (Clothing)
    { name: 'Season', nameMn: 'Улирал', values: 'Зун,Өвөл,Хавар,Намар,Бүх улирал' },
    // Age Group
    { name: 'Age Group', nameMn: 'Насны бүлэг', values: 'Нялх,Хүүхэд,Өсвөр нас,Насанд хүрэгч' },
    // Gender (Clothing)
    { name: 'Gender', nameMn: 'Хүйс', values: 'Эрэгтэй,Эмэгтэй,Хүйсийн бус' },
    // Packaging
    { name: 'Package', nameMn: 'Багц', values: '1 ш,2 ш,3 ш,5 ш,10 ш' },
    // Scent / Flavor
    { name: 'Scent', nameMn: 'Үнэр', values: 'Хүнсэмтгий,Цэцгийн,Жимсний,Ой модны,Анхилуун' },
];

async function seed() {
    try {
        await sequelize.authenticate();
        console.log('✅ Database connected.');

        let added = 0;
        let skipped = 0;

        for (const attr of COMMON_ATTRIBUTES) {
            const [record, created] = await Attribute.findOrCreate({
                where: { name: attr.name },
                defaults: attr,
            });

            if (created) {
                console.log(`  ➕ Added: ${attr.nameMn} (${attr.name})`);
                added++;
            } else {
                // Update values if changed
                if (record.values !== attr.values || record.nameMn !== attr.nameMn) {
                    await record.update({ values: attr.values, nameMn: attr.nameMn });
                    console.log(`  🔄 Updated: ${attr.nameMn} (${attr.name})`);
                    added++;
                } else {
                    console.log(`  ⏭ Skipped (already exists): ${attr.name}`);
                    skipped++;
                }
            }
        }

        console.log(`\n✅ Done! Added/Updated: ${added}, Skipped: ${skipped}`);
        process.exit(0);
    } catch (err) {
        console.error('❌ Error seeding attributes:', err.message);
        process.exit(1);
    }
}

seed();
