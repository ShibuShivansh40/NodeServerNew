// const {
//     DataTypes
// } = require('sequelize');
// const sequelize = require('../db');

// const Product = sequelize.define('Product', {
//     name: {
//         type: DataTypes.STRING,
//         allowNull: false,
//         unique: true
//     },
//     category: {
//         type: DataTypes.ENUM('Black', 'Colored', '7D'),
//         allowNull: false
//     },
//     code: {
//         type: DataTypes.STRING,
//         allowNull: true, // Keep NOT NULL if possible; if fails, set to true temporarily
//         unique: true
//     }
// });

// module.exports = Product;

const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const Product = sequelize.define('Product', {
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    category: {
        type: DataTypes.ENUM('Black', 'Colored', 'Antiskid'),
        allowNull: false
    },
    code: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true
    },
    // NEW: Inventory tracking field
    stock: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    }
});

module.exports = Product;
