// const express = require('express');
// const router = express.Router();
// const {
//     Op
// } = require('sequelize');
// const puppeteer = require('puppeteer'); // Make sure this is imported here if not in controller
// const invoiceTemplate = require('../templates/invoiceTemplate');
// const invoiceController = require('../controllers/invoiceGenerator');
// const Invoice = require('../models/Invoice');
// const Client = require('../models/Client');
// const Product = require('../models/Product');

// // Log all incoming requests (good for debugging)
// router.use((req, res, next) => {
//     console.log(`Route hit: ${req.method} ${req.path}`);
//     next();
// });

// // Standard Routes (unchanged)
// router.post('/generate-pdf', invoiceController.createAndSendPDF);
// router.post('/fetch-pdf', invoiceController.fetchExistingPDF);
// router.get('/records', invoiceController.getAllRecords);
// router.get('/count', invoiceController.getCount);

// // Summary Route (unchanged, looks fine)
// router.post('/generate-summary', async (req, res) => {
//     try {
//         const {
//             ids
//         } = req.body;
//         const invoices = await Invoice.findAll({
//             where: {
//                 refNo: {
//                     [Op.in]: ids
//                 }
//             }
//         });

//         if (invoices.length === 0) return res.status(404).json({
//             error: "No records found"
//         });

//         const summaryData = invoices.reduce((acc, inv) => {
//             const client = inv.clientName;
//             if (!acc[client]) {
//                 acc[client] = {
//                     colored: {
//                         qty: 0,
//                         bags: 0
//                     },
//                     black: {
//                         qty: 0,
//                         bags: 0
//                     },
//                     tpe: {
//                         qty: 0,
//                         bags: 0
//                     }
//                 };
//             }

//             inv.items.forEach(item => {
//                 const cat = (item.category || '').toLowerCase();
//                 const qty = parseFloat(item.qty || 0);
//                 if (cat.includes('colored')) acc[client].colored.qty += qty;
//                 else if (cat.includes('black')) acc[client].black.qty += qty;
//                 else if (cat.includes('tpe')) acc[client].tpe.qty += qty;
//             });

//             acc[client].colored.bags = Math.ceil(acc[client].colored.qty / 25);
//             acc[client].black.bags = Math.ceil(acc[client].black.qty / 50);
//             acc[client].tpe.bags = Math.ceil(acc[client].tpe.qty / 25);

//             return acc;
//         }, {});

//         const pdfBase64 = await invoiceController.generateSummaryPDF(summaryData);
//         res.json({
//             success: true,
//             pdf: pdfBase64
//         });
//     } catch (error) {
//         console.error("Summary Generation Error:", error);
//         res.status(500).json({
//             success: false,
//             error: error.message
//         });
//     }
// });

// // Client Routes (unchanged)
// router.get('/clients', async (req, res) => {
//     try {
//         const clients = await Client.findAll({
//             order: [
//                 ['name', 'ASC']
//             ]
//         });
//         res.json(clients);
//     } catch (err) {
//         res.status(500).json({
//             error: err.message
//         });
//     }
// });

// router.post('/clients', async (req, res) => {
//     try {
//         const newClient = await Client.create(req.body);
//         res.status(201).json(newClient);
//     } catch (err) {
//         res.status(400).json({
//             error: "Client already exists or invalid data"
//         });
//     }
// });

// // Product Routes (your version is good - keep it)
// router.get('/products', async (req, res) => {
//     try {
//         const products = await Product.findAll({
//             order: [
//                 ['name', 'ASC']
//             ]
//         });
//         res.json(products);
//     } catch (err) {
//         res.status(500).json({
//             error: err.message
//         });
//     }
// });

// router.post('/products', async (req, res) => {
//     try {
//         const {
//             name,
//             category,
//             code
//         } = req.body;
//         const newProduct = await Product.create({
//             name,
//             category,
//             code
//         });
//         res.status(201).json(newProduct);
//     } catch (err) {
//         res.status(400).json({
//             error: "Product already exists or invalid data"
//         });
//     }
// });

// // Fetch single invoice (your version is good - keep)
// router.get('/invoice/:refNo', async (req, res) => {
//     console.log('Fetching invoice for refNo:', req.params.refNo);
//     try {
//         const invoice = await Invoice.findByPk(req.params.refNo);
//         if (!invoice) {
//             console.log('No invoice found for refNo:', req.params.refNo);
//             return res.status(404).json({
//                 error: 'Invoice not found'
//             });
//         }
//         console.log('Found invoice:', invoice.toJSON());
//         res.json(invoice.toJSON());
//     } catch (err) {
//         console.error('Fetch invoice error:', err);
//         res.status(500).json({
//             error: err.message
//         });
//     }
// });


// router.put('/update-invoice/:refNo', async (req, res) => {
//     const refNo = req.params.refNo;
//     console.log(`[PUT] Started for refNo: ${refNo}`);
//     console.log(`[PUT] Incoming body:`, JSON.stringify(req.body, null, 2));

//     if (!req.body || !req.body.clientName || !req.body.items || !Array.isArray(req.body.items)) {
//         console.log('[PUT] Invalid body');
//         return res.status(400).json({
//             success: false,
//             error: 'Invalid request body'
//         });
//     }

//     let browser = null;
//     try {
//         const invoice = await Invoice.findByPk(refNo);
//         if (!invoice) {
//             console.log('[PUT] Invoice not found');
//             return res.status(404).json({
//                 success: false,
//                 error: 'Invoice not found'
//             });
//         }

//         console.log('[PUT] Before update:', invoice.toJSON());

//         // Update DB
//         await invoice.update({
//             clientName: req.body.clientName,
//             date: req.body.date,
//             items: req.body.items,
//             total: req.body.total || 0
//         });
//         await invoice.reload();
//         console.log('[PUT] After update:', invoice.toJSON());

//         // Generate PDF using updated data
//         console.log('[PUT] Launching Puppeteer...');
//         browser = await puppeteer.launch({
//             headless: 'shell',
//             args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
//         });
//         const page = await browser.newPage();
//         console.log('[PUT] Generating HTML...');
//         const html = invoiceTemplate(invoice.toJSON()); // Use fresh DB data
//         await page.setContent(html, {
//             waitUntil: 'networkidle0'
//         });
//         console.log('[PUT] Creating PDF buffer...');
//         const pdfBuffer = await page.pdf({
//             format: 'A6',
//             printBackground: true,
//             margin: {
//                 top: '10mm',
//                 right: '10mm',
//                 bottom: '10mm',
//                 left: '10mm'
//             }
//         });
//         await browser.close();
//         browser = null;

//         const base64 = Buffer.from(pdfBuffer).toString('base64');
//         console.log(`[PUT] PDF ready - length: ${base64.length}`);

//         res.json({
//             success: true,
//             pdf: base64,
//             refNo
//         });
//     } catch (err) {
//         if (browser) await browser.close().catch(e => console.error('Browser close fail:', e));
//         console.error('[PUT] ERROR:', err.message);
//         console.error('[PUT] Stack:', err.stack);
//         res.status(500).json({
//             success: false,
//             error: err.message || 'Server error'
//         });
//     }
// });


// module.exports = router;

//======================================================================================

// const express = require('express');
// const router = express.Router();
// const { Op } = require('sequelize');
// const puppeteer = require('puppeteer');
// const invoiceTemplate = require('../templates/invoiceTemplate');
// const invoiceController = require('../controllers/invoiceGenerator');
// const Invoice = require('../models/Invoice');
// const Client = require('../models/Client');
// const Product = require('../models/Product');

// router.use((req, res, next) => {
//     console.log(`Route hit: ${req.method} ${req.path}`);
//     next();
// });

// router.post('/generate-pdf', invoiceController.createAndSendPDF);
// router.post('/fetch-pdf', invoiceController.fetchExistingPDF);
// router.get('/records', invoiceController.getAllRecords);
// router.get('/count', invoiceController.getCount);

// router.post('/generate-summary', async (req, res) => {
//     try {
//         const { ids } = req.body;
//         const invoices = await Invoice.findAll({ where: { refNo: { [Op.in]: ids } } });

//         if (invoices.length === 0) return res.status(404).json({ error: "No records found" });

//         const summaryData = invoices.reduce((acc, inv) => {
//             const client = inv.clientName;
//             if (!acc[client]) {
//                 acc[client] = { colored: { qty: 0, bags: 0 }, black: { qty: 0, bags: 0 }, tpe: { qty: 0, bags: 0 } };
//             }

//             inv.items.forEach(item => {
//                 const cat = (item.category || '').toLowerCase();
//                 const qty = parseFloat(item.qty || 0);
//                 if (cat.includes('colored')) acc[client].colored.qty += qty;
//                 else if (cat.includes('black')) acc[client].black.qty += qty;
//                 else if (cat.includes('tpe')) acc[client].tpe.qty += qty;
//             });

//             acc[client].colored.bags = Math.ceil(acc[client].colored.qty / 25);
//             acc[client].black.bags = Math.ceil(acc[client].black.qty / 50);
//             acc[client].tpe.bags = Math.ceil(acc[client].tpe.qty / 25);

//             return acc;
//         }, {});

//         const pdfBase64 = await invoiceController.generateSummaryPDF(summaryData);
//         res.json({ success: true, pdf: pdfBase64 });
//     } catch (error) {
//         res.status(500).json({ success: false, error: error.message });
//     }
// });

// // Client Routes
// router.get('/clients', async (req, res) => {
//     try {
//         const clients = await Client.findAll({ order: [['name', 'ASC']] });
//         res.json(clients);
//     } catch (err) { res.status(500).json({ error: err.message }); }
// });

// router.post('/clients', async (req, res) => {
//     try {
//         const newClient = await Client.create(req.body);
//         res.status(201).json(newClient);
//     } catch (err) { res.status(400).json({ error: "Client exists or invalid data" }); }
// });

// router.put('/clients/:id', async (req, res) => {
//     try {
//         const client = await Client.findByPk(req.params.id);
//         if (!client) return res.status(404).json({ error: 'Client not found' });
//         await client.update(req.body);
//         res.json({ success: true, client });
//     } catch (err) { res.status(500).json({ error: err.message }); }
// });

// router.delete('/clients/:id', async (req, res) => {
//     try {
//         const client = await Client.findByPk(req.params.id);
//         if (!client) return res.status(404).json({ error: 'Client not found' });
//         await client.destroy();
//         res.json({ success: true, message: 'Client deleted' });
//     } catch (err) { res.status(500).json({ error: err.message }); }
// });

// // Product Routes (Now includes Stock)
// router.get('/products', async (req, res) => {
//     try {
//         const products = await Product.findAll({ order: [['name', 'ASC']] });
//         res.json(products);
//     } catch (err) { res.status(500).json({ error: err.message }); }
// });

// router.post('/products', async (req, res) => {
//     try {
//         const { name, category, code, stock } = req.body; 
//         const newProduct = await Product.create({ name, category, code, stock: stock || 0 });
//         res.status(201).json(newProduct);
//     } catch (err) { res.status(400).json({ error: "Product exists or invalid data" }); }
// });

// router.put('/products/:id', async (req, res) => {
//     try {
//         const product = await Product.findByPk(req.params.id);
//         if (!product) return res.status(404).json({ error: 'Product not found' });
//         await product.update(req.body);
//         res.json({ success: true, product });
//     } catch (err) { res.status(500).json({ error: err.message }); }
// });

// router.delete('/products/:id', async (req, res) => {
//     try {
//         const product = await Product.findByPk(req.params.id);
//         if (!product) return res.status(404).json({ error: 'Product not found' });
//         await product.destroy();
//         res.json({ success: true, message: 'Product deleted' });
//     } catch (err) { res.status(500).json({ error: err.message }); }
// });

// // Single Invoice Routes
// router.get('/invoice/:refNo', async (req, res) => {
//     try {
//         const refNo = decodeURIComponent(req.params.refNo);
//         const invoice = await Invoice.findByPk(refNo);
//         if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
//         res.json(invoice.toJSON());
//     } catch (err) { res.status(500).json({ error: err.message }); }
// });

// router.put('/update-invoice/:refNo', async (req, res) => {
//     let browser = null;
//     try {
//         const refNo = decodeURIComponent(req.params.refNo);
//         const invoice = await Invoice.findByPk(refNo);
        
//         if (!invoice) return res.status(404).json({ success: false, error: 'Invoice not found' });

//         await invoice.update({
//             clientName: req.body.clientName,
//             date: req.body.date,
//             items: req.body.items,
//             total: req.body.total || 0
//         });
        
//         browser = await puppeteer.launch({ headless: 'shell', args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'] });
//         const page = await browser.newPage();
//         const html = invoiceTemplate(invoice.toJSON());
//         await page.setContent(html);
        
//         const pdfBuffer = await page.pdf({ format: 'A6', printBackground: true });
//         await browser.close();

//         res.json({ success: true, pdf: Buffer.from(pdfBuffer).toString('base64'), refNo });
//     } catch (err) {
//         if (browser) await browser.close();
//         res.status(500).json({ success: false, error: err.message });
//     }
// });

// router.delete('/invoice/:refNo', async (req, res) => {
//     try {
//         const refNo = decodeURIComponent(req.params.refNo);
//         const invoice = await Invoice.findByPk(refNo);
//         if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
//         await invoice.destroy();
//         res.json({ success: true, message: 'Invoice deleted' });
//     } catch (err) { res.status(500).json({ error: err.message }); }
// });

// module.exports = router;


const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const puppeteer = require('puppeteer');
const invoiceTemplate = require('../templates/invoiceTemplate');
const invoiceController = require('../controllers/invoiceGenerator'); // Update path if needed
const Invoice = require('../models/Invoice');
const Client = require('../models/Client');
const Product = require('../models/Product');

// Log all incoming requests for debugging
router.use((req, res, next) => {
    console.log(`Route hit: ${req.method} ${req.path}`);
    next();
});

// --- Standard Routes ---
router.post('/generate-pdf', invoiceController.createAndSendPDF);
router.post('/fetch-pdf', invoiceController.fetchExistingPDF);
router.get('/records', invoiceController.getAllRecords);
router.get('/count', invoiceController.getCount);

// --- Summary Route ---
router.post('/generate-summary', async (req, res) => {
    try {
        const { ids } = req.body;
        const invoices = await Invoice.findAll({ where: { refNo: { [Op.in]: ids } } });
        
        if (invoices.length === 0) return res.status(404).json({ error: 'No records found' });

        const summaryData = invoices.reduce((acc, inv) => {
            const client = inv.clientName;
            if (!acc[client]) {
                acc[client] = {
                    colored: { qty: 0, bags: 0 },
                    black: { qty: 0, bags: 0 },
                    antiskid: { qty: 0, bags: 0 }
                };
            }
            inv.items.forEach(item => {
                const cat = (item.category || '').toLowerCase();
                const qty = parseFloat(item.qty) || 0;
                if (cat.includes('colored')) acc[client].colored.qty += qty;
                else if (cat.includes('black')) acc[client].black.qty += qty;
                else if (cat.includes('antiskid')) acc[client].antiskid.qty += qty;
            });

            acc[client].colored.bags = Math.ceil(acc[client].colored.qty / 25);
            acc[client].black.bags = Math.ceil(acc[client].black.qty / 50);
            acc[client].antiskid.bags = Math.ceil(acc[client].antiskid.qty / 25);
            
            return acc;
        }, {});

        const pdfBase64 = await invoiceController.generateSummaryPDF(summaryData);
        res.json({ success: true, pdf: pdfBase64 });
    } catch (error) {
        console.error('Summary Generation Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// --- Client Routes ---
router.get('/clients', async (req, res) => {
    try {
        const clients = await Client.findAll({ order: [['name', 'ASC']] });
        res.json(clients);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/clients', async (req, res) => {
    try {
        const newClient = await Client.create(req.body);
        res.status(201).json(newClient);
    } catch (err) {
        res.status(400).json({ error: 'Client already exists or invalid data' });
    }
});

// --- Product Routes ---
router.get('/products', async (req, res) => {
    try {
        const products = await Product.findAll({ order: [['name', 'ASC']] });
        res.json(products);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/products', async (req, res) => {
    try {
        const { name, category, code, stock } = req.body;
        const newProduct = await Product.create({ name, category, code, stock: parseInt(stock) || 0 });
        res.status(201).json(newProduct);
    } catch (err) {
        res.status(400).json({ error: 'Product already exists or invalid data' });
    }
});

// --- Fetch Single Invoice (For Edit Pre-filling) ---
router.get('/invoice/:refNo', async (req, res) => {
    try {
        const invoice = await Invoice.findByPk(req.params.refNo);
        if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
        res.json(invoice.toJSON());
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- Update Invoice (Edit Mode) & Adjust Stock ---
router.put('/update-invoice/:refNo', async (req, res) => {
    const refNo = req.params.refNo;
    console.log('PUT Started for refNo', refNo);

    if (!req.body || !req.body.clientName || !req.body.items || !Array.isArray(req.body.items)) {
        return res.status(400).json({ success: false, error: 'Invalid request body' });
    }

    let browser = null;
    try {
        const invoice = await Invoice.findByPk(refNo);
        if (!invoice) {
            return res.status(404).json({ success: false, error: 'Invoice not found' });
        }

        // --- 1. REFUND OLD STOCK ---
        const oldItems = invoice.items || [];
        for (const oldItem of oldItems) {
            if (oldItem.code) {
                const product = await Product.findOne({ where: { code: oldItem.code } });
                if (product) {
                    const currentStock = parseInt(product.stock) || 0;
                    const oldQty = parseInt(oldItem.qty) || 0;
                    await product.update({ stock: currentStock + oldQty });
                }
            }
        }

        // --- 2. DEDUCT NEW STOCK ---
        const newItems = req.body.items || [];
        for (const newItem of newItems) {
            if (newItem.code) {
                const product = await Product.findOne({ where: { code: newItem.code } });
                if (product) {
                    const currentStock = parseInt(product.stock) || 0;
                    const newQty = parseInt(newItem.qty) || 0;
                    await product.update({ stock: Math.max(0, currentStock - newQty) });
                }
            }
        }

        // --- 3. UPDATE DATABASE ---
        await invoice.update({
            clientName: req.body.clientName,
            date: req.body.date,
            items: req.body.items,
            total: req.body.total || 0
        });
        await invoice.reload();

        // --- 4. REGENERATE PDF ---
        browser = await puppeteer.launch({
            headless: 'shell',
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
        });
        
        const page = await browser.newPage();
        const html = invoiceTemplate(invoice.toJSON());
        await page.setContent(html, { waitUntil: 'networkidle0' });
        
        const pdfBuffer = await page.pdf({
            format: 'A6',
            printBackground: true,
            margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' }
        });
        
        await browser.close();
        browser = null;
        
        const base64 = Buffer.from(pdfBuffer).toString('base64');
        res.json({ success: true, pdf: base64, refNo });

    } catch (err) {
        if (browser) await browser.close().catch(e => console.error('Browser close fail:', e));
        console.error('PUT ERROR:', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// --- Update Existing Product (Edit Mode) ---
// --- Update Existing Product ---
// router.put('/products/:id', async (req, res) => {
//     try {
//         const product = await Product.findByPk(req.params.id);
//         if (!product) return res.status(404).json({ error: 'Product not found' });

//         await product.update({
//             name: req.body.name || product.name,
//             category: req.body.category || product.category,
//             code: req.body.code || product.code,
//             stock: req.body.stock !== undefined ? parseInt(req.body.stock) : product.stock
//         });
//         res.json({ success: true, product });
//     } catch (err) {
//         console.error('Error updating product:', err);
//         res.status(500).json({ error: 'Failed to update product. Code/Name may already exist.' });
//     }
// });

// // --- Delete Product ---
// router.delete('/products/:id', async (req, res) => {
//     try {
//         const product = await Product.findByPk(req.params.id);
//         if (!product) return res.status(404).json({ error: 'Product not found' });

//         await product.destroy();
//         res.json({ success: true, message: 'Product deleted' });
//     } catch (err) {
//         console.error('Error deleting product:', err);
//         res.status(500).json({ error: 'Failed to delete product' });
//     }
// });

// --- Update Existing Product (Modifying Quantities/Details) ---
router.put('/products/:id', async (req, res) => {
    try {
        const product = await Product.findByPk(req.params.id);
        if (!product) return res.status(404).json({ error: 'Product not found' });

        await product.update({
            name: req.body.name || product.name,
            category: req.body.category || product.category,
            code: req.body.code || product.code,
            stock: req.body.stock !== undefined ? parseInt(req.body.stock) : product.stock
        });
        
        res.json({ success: true, product });
    } catch (err) {
        console.error('Error updating product:', err);
        res.status(500).json({ error: 'Failed to update product. Code or Name may already exist.' });
    }
});

// --- Delete Existing Product ---
router.delete('/products/:id', async (req, res) => {
    try {
        const product = await Product.findByPk(req.params.id);
        if (!product) return res.status(404).json({ error: 'Product not found' });

        await product.destroy();
        res.json({ success: true, message: 'Product deleted successfully' });
    } catch (err) {
        console.error('Error deleting product:', err);
        res.status(500).json({ error: 'Failed to delete product' });
    }
});


// --- Update Existing Client ---
// router.put('/clients/:id', async (req, res) => {
//     try {
//         const client = await Client.findByPk(req.params.id);
//         if (!client) return res.status(404).json({ error: 'Client not found' });

//         await client.update({
//             name: req.body.name || client.name,
//             address: req.body.address !== undefined ? req.body.address : client.address
//         });
//         res.json({ success: true, client });
//     } catch (err) {
//         console.error('Error updating client:', err);
//         res.status(500).json({ error: 'Failed to update client' });
//     }
// });

// // --- Delete Client ---
// router.delete('/clients/:id', async (req, res) => {
//     try {
//         const client = await Client.findByPk(req.params.id);
//         if (!client) return res.status(404).json({ error: 'Client not found' });

//         await client.destroy();
//         res.json({ success: true, message: 'Client deleted' });
//     } catch (err) {
//         console.error('Error deleting client:', err);
//         res.status(500).json({ error: 'Failed to delete client' });
//     }
// });


// --- Update Existing Client ---
router.put('/clients/:id', async (req, res) => {
    try {
        const client = await Client.findByPk(req.params.id);
        if (!client) return res.status(404).json({ error: 'Client not found' });

        await client.update({
            name: req.body.name || client.name,
            address: req.body.address !== undefined ? req.body.address : client.address
        });
        res.json({ success: true, client });
    } catch (err) {
        console.error('Error updating client:', err);
        res.status(500).json({ error: 'Failed to update client' });
    }
});

// --- Delete Existing Client ---
router.delete('/clients/:id', async (req, res) => {
    try {
        const client = await Client.findByPk(req.params.id);
        if (!client) return res.status(404).json({ error: 'Client not found' });

        await client.destroy();
        res.json({ success: true, message: 'Client deleted' });
    } catch (err) {
        console.error('Error deleting client:', err);
        res.status(500).json({ error: 'Failed to delete client' });
    }
});

module.exports = router;
