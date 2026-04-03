// // const puppeteer = require('puppeteer');
// // //const { Invoice } = require('../models/Invoice');
// // const Invoice = require('../models/Invoice');
// // const invoiceTemplate = require('../templates/invoiceTemplate');
// // const {
// //     Op
// // } = require('sequelize');
// // const summaryTemplate = require('../templates/summaryTemplate');

// // // Helper to get initials
// // const getInitials = (name) => {
// //     const names = name.trim().split(' ');
// //     const initials = names.map(n => n.charAt(0).toUpperCase());
// //     return initials.length > 1 ?
// //         `${initials[0]}${initials[initials.length - 1]}` :
// //         initials[0].substring(0, 2);
// // };

// // // --- REUSABLE PDF LOGIC ---
// // const generatePDF = async (data) => {
// //     let browser;
// //     try {
// //         browser = await puppeteer.launch({
// //             headless: 'shell',
// //             args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
// //         });
// //         const page = await browser.newPage();
// //         const htmlContent = invoiceTemplate(data);
// //         await page.setContent(htmlContent);
// //         const pdfBuffer = await page.pdf({
// //             format: 'A6',
// //             printBackground: true
// //         });
// //         await browser.close();
// //         return Buffer.from(pdfBuffer).toString('base64');
// //     } catch (error) {
// //         if (browser) await browser.close();
// //         throw error;
// //     }
// // };

// // // --- ROUTE 1: CREATE NEW ---
// // exports.createAndSendPDF = async (req, res) => {
// //     try {
// //         const currentYear = new Date().getFullYear();
// //         const initials = getInitials(req.body.clientName);

// //         const count = await Invoice.count({
// //             where: {
// //                 refNo: {
// //                     [Op.like]: `${currentYear}/${initials}/%`
// //                 }
// //             }
// //         });

// //         const sequence = (count + 1).toString().padStart(3, '0');
// //         const generatedRefNo = `${currentYear}/${initials}/${sequence}`;

// //         // Save to DB using the generated primary key [web:386]
// //         const invoice = await Invoice.create({
// //             ...req.body,
// //             refNo: generatedRefNo
// //         });

// //         // Generate PDF using helper
// //         const base64String = await generatePDF(invoice);

// //         res.json({
// //             success: true,
// //             pdf: base64String,
// //             refNo: generatedRefNo
// //         });
// //     } catch (error) {
// //         console.error("Server Error:", error);
// //         res.status(500).json({
// //             success: false,
// //             error: error.message
// //         });
// //     }
// // };

// // // --- ROUTE 2: FETCH EXISTING ---
// // exports.fetchExistingPDF = async (req, res) => {
// //     try {
// //         const {
// //             refNo
// //         } = req.body;
// //         // Find specific record by primary key [web:413]
// //         const record = await Invoice.findByPk(refNo);

// //         if (!record) {
// //             return res.status(404).json({
// //                 success: false,
// //                 error: "Invoice not found"
// //             });
// //         }

// //         // Reuse the same PDF generation logic [web:492]
// //         const base64String = await generatePDF(record);

// //         res.json({
// //             success: true,
// //             pdf: base64String,
// //             refNo: record.refNo
// //         });
// //     } catch (error) {
// //         console.error("Fetch Error:", error);
// //         res.status(500).json({
// //             success: false,
// //             error: error.message
// //         });
// //     }
// // };

// // // --- ROUTE 3: LIST ALL ---
// // exports.getAllRecords = async (req, res) => {
// //     try {
// //         const records = await Invoice.findAll({
// //             order: [
// //                 ['createdAt', 'DESC']
// //             ]
// //         });
// //         res.json(records);
// //     } catch (error) {
// //         res.status(500).json({
// //             error: error.message
// //         });
// //     }
// // };

// // exports.generateSummaryPDF = async (summaryData) => {
// //     let browser;
// //     try {
// //         browser = await puppeteer.launch({
// //             headless: 'shell',
// //             args: ['--no-sandbox', '--disable-setuid-sandbox']
// //         });
// //         const page = await browser.newPage();
// //         const html = summaryTemplate(summaryData); // Use the new template
// //         await page.setContent(html);

// //         const pdfBuffer = await page.pdf({
// //             format: 'A5',
// //             printBackground: true,
// //             preferCSSPageSize: true
// //         });

// //         await browser.close();
// //         return Buffer.from(pdfBuffer).toString('base64');
// //     } catch (error) {
// //         if (browser) await browser.close();
// //         throw error;
// //     }
// // };

// // exports.getCount = async (req, res) => {
// //     try {
// //         const count = await Invoice.count(); // Sequelize method to get total [file:891]
// //         res.json({
// //             count
// //         });
// //     } catch (error) {
// //         res.status(500).json({
// //             error: error.message
// //         });
// //     }
// // };

// const puppeteer = require('puppeteer');
// const Invoice = require('../models/Invoice');
// const Product = require('../models/Product'); // Added Product import for inventory
// const invoiceTemplate = require('../templates/invoiceTemplate');
// const { Op } = require('sequelize');
// const summaryTemplate = require('../templates/summaryTemplate');

// const getInitials = (name) => {
//     const names = name.trim().split(' ');
//     const initials = names.map(n => n.charAt(0).toUpperCase());
//     return initials.length > 1 ?
//         `${initials[0]}${initials[initials.length - 1]}` :
//         initials[0].substring(0, 2);
// };

// const generatePDF = async (data) => {
//     let browser;
//     try {
//         browser = await puppeteer.launch({
//             headless: 'shell',
//             args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
//         });
//         const page = await browser.newPage();
//         const htmlContent = invoiceTemplate(data);
//         await page.setContent(htmlContent);
//         const pdfBuffer = await page.pdf({ format: 'A6', printBackground: true });
//         await browser.close();
//         return Buffer.from(pdfBuffer).toString('base64');
//     } catch (error) {
//         if (browser) await browser.close();
//         throw error;
//     }
// };

// exports.createAndSendPDF = async (req, res) => {
//     try {
//         const dateObj = new Date();
//         const currentYear = dateObj.getFullYear();
//         // Add current month (e.g. "03" for March)
//         const currentMonth = String(dateObj.getMonth() + 1).padStart(2, '0');
//         const initials = getInitials(req.body.clientName);

//         const count = await Invoice.count({
//             where: {
//                 refNo: {
//                     [Op.like]: `${currentYear}/${currentMonth}/${initials}/%`
//                 }
//             }
//         });

//         const sequence = (count + 1).toString().padStart(3, '0');
//         // Include month in the generated RefNo
//         const generatedRefNo = `${currentYear}/${currentMonth}/${initials}/${sequence}`;

//         // 1. Save Invoice to DB
//         const invoiceData = { ...req.body, refNo: generatedRefNo };
//         const invoice = await Invoice.create(invoiceData);

//         // 2. INVENTORY DEDUCTION LOGIC
//         if (req.body.items && Array.isArray(req.body.items)) {
//             for (let item of req.body.items) {
//                 // Find product by name or code to deduct stock
//                 const product = await Product.findOne({ where: { name: item.name } });
//                 if (product) {
//                     const quantitySold = parseFloat(item.qty) || 0;
//                     product.stock = product.stock - quantitySold;
//                     await product.save();
//                 }
//             }
//         }

//         // 3. Generate PDF
//         const base64String = await generatePDF(invoiceData);

//         res.json({
//             success: true,
//             pdf: base64String,
//             refNo: generatedRefNo
//         });
//     } catch (error) {
//         console.error("Server Error:", error);
//         res.status(500).json({ success: false, error: error.message });
//     }
// };

// exports.fetchExistingPDF = async (req, res) => {
//     try {
//         const { refNo } = req.body;
//         const record = await Invoice.findByPk(refNo);
//         if (!record) return res.status(404).json({ success: false, error: "Invoice not found" });
//         const base64String = await generatePDF(record);
//         res.json({ success: true, pdf: base64String, refNo: record.refNo });
//     } catch (error) {
//         res.status(500).json({ success: false, error: error.message });
//     }
// };

// exports.getAllRecords = async (req, res) => {
//     try {
//         const records = await Invoice.findAll({ order: [['createdAt', 'DESC']] });
//         res.json(records);
//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// };

// exports.generateSummaryPDF = async (summaryData) => {
//     let browser;
//     try {
//         browser = await puppeteer.launch({ headless: 'shell', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
//         const page = await browser.newPage();
//         const html = summaryTemplate(summaryData);
//         await page.setContent(html);
//         const pdfBuffer = await page.pdf({ format: 'A5', printBackground: true, preferCSSPageSize: true });
//         await browser.close();
//         return Buffer.from(pdfBuffer).toString('base64');
//     } catch (error) {
//         if (browser) await browser.close();
//         throw error;
//     }
// };

// exports.getCount = async (req, res) => {
//     try {
//         const count = await Invoice.count();
//         res.json({ count });
//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// };


const puppeteer = require('puppeteer');
const Invoice = require('../models/Invoice');
const Product = require('../models/Product');
const invoiceTemplate = require('../templates/invoiceTemplate');
const summaryTemplate = require('../templates/summaryTemplate'); 
const { Op } = require('sequelize');

const getInitials = (name) => {
    if (!name) return 'XX';
    const names = name.trim().split(' ');
    const initials = names.map(n => n.charAt(0).toUpperCase());
    return initials.length === 1 ? initials[0] + initials[0] : (initials[0] + initials[initials.length - 1]);
};

exports.createAndSendPDF = async (req, res) => {
    let browser;
    try {
        const currentYear = new Date().getFullYear();
        const initials = getInitials(req.body.clientName);
        
        const count = await Invoice.count({
            where: { refNo: { [Op.like]: `${currentYear}${initials}%` } }
        });
        
        const sequence = (count + 1).toString().padStart(3, '0');
        const generatedRefNo = `${currentYear}${initials}${sequence}`;
        
        // 1. Save record to Database
        const invoiceData = { ...req.body, refNo: generatedRefNo };
        const invoice = await Invoice.create(invoiceData);

        // 2. Adjust Inventory (Deduct Stock)
        if (req.body.items && Array.isArray(req.body.items)) {
            for (const item of req.body.items) {
                if (item.code) {
                    const product = await Product.findOne({ where: { code: item.code } });
                    if (product) {
                        const currentStock = parseInt(product.stock) || 0;
                        const qtySold = parseInt(item.qty) || 0;
                        await product.update({ stock: Math.max(0, currentStock - qtySold) });
                    }
                }
            }
        }

        // 3. Launch Puppeteer
        browser = await puppeteer.launch({
            headless: 'shell',
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
        });
        
        const page = await browser.newPage();
        
        // 4. Generate HTML
        const htmlContent = invoiceTemplate(req.body);
        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
        
        // 5. Create PDF Buffer
        const pdfBuffer = await page.pdf({ format: 'A6', printBackground: true });
        await browser.close();
        
        // 6. Send Base64 response
        const base64String = Buffer.from(pdfBuffer).toString('base64');
        res.json({ success: true, pdf: base64String, refNo: generatedRefNo, recordId: invoice.id });
        
    } catch (error) {
        if (browser) await browser.close();
        console.error('Server Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.fetchExistingPDF = async (req, res) => {
    let browser;
    try {
        const { refNo } = req.body;
        const invoice = await Invoice.findByPk(refNo);
        if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

        browser = await puppeteer.launch({
            headless: 'shell',
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
        });
        const page = await browser.newPage();
        await page.setContent(invoiceTemplate(invoice.toJSON()), { waitUntil: 'networkidle0' });
        const pdfBuffer = await page.pdf({ format: 'A6', printBackground: true });
        await browser.close();

        res.json({ success: true, pdf: Buffer.from(pdfBuffer).toString('base64') });
    } catch (error) {
        if (browser) await browser.close();
        console.error('Error fetching PDF:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.getAllRecords = async (req, res) => {
    try {
        const records = await Invoice.findAll({ order: [['createdAt', 'DESC']] });
        res.json(records);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getCount = async (req, res) => {
    try {
        const count = await Invoice.count();
        res.json({ count });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.generateSummaryPDF = async (summaryData) => {
    let browser;
    try {
        browser = await puppeteer.launch({
            headless: 'shell',
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
        });
        const page = await browser.newPage();
        const html = summaryTemplate(summaryData);
        await page.setContent(html, { waitUntil: 'networkidle0' });
        const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true, margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' } });
        await browser.close();
        return Buffer.from(pdfBuffer).toString('base64');
    } catch (error) {
        if (browser) await browser.close();
        throw error;
    }
};
