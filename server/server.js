const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const storage = require('node-persist');
const customers = require('../Customers.json');
const registration = require('../Registrations.json');
const { v4: uuidv4 } = require('uuid');

(async () => {
    await storage.init({ dir: './data' });
    // for (let c of customers) {
    //     await storage.setItem(`licence-${c.licenceNumber}`.toString(), c)
    // };
    // for (let r of registration) {
    //     await storage.setItem(`vin-${r.vinNumber}`.toString(), r)
    // };
    const server = express();
    server.use(bodyParser.json());
    server.use(express.json());
    server.use(cors());
    // console.log(uuidv4())

    server.get('/api/registrations', async (req, res) => {
        let registrations = await storage.valuesWithKeyMatch(/vin-/)
        res.json(registrations)
    })
    server.get('/api/customers', async (req, res) => {
        let customers = await storage.valuesWithKeyMatch(/licence-/)
        res.json(customers)
    })

    server.get('/api/registrations/:vinNumber', async (req, res) => {
        let registration = await storage.getItem(`vin-${req.params.vinNumber}`)
        if (registration == undefined) {
            res.json({ status: 400, message: "vehicle identifier does not exist" })
        } else {
            res.json(registration)
        }
    })

    server.post('/api/registrations', async (req, res) => {
        let customer;
        if (req.body.licenceHeld != "Yes") {
            customer = {
                licenceNumber: uuidv4(),
                firstName: req.body.firstName,
                lastName: req.body.lastName,
                address: req.body.address,
                dateOfBirth: {
                    day: req.body.dobDay,
                    month: req.body.dobMonth,
                    year: req.body.dobYear
                }
            };
            await storage.setItem(`licence-${customer.licenceNumber}`.toString(), customer);

        }
        else {
            customer = await storage.getItem(`licence-${req.body.licenceNumber}`)
        }
        let licenceNumber = customer.licenceNumber
        let vinNumber = req.body.vinNumber
        let vehicle = {
            manufactureYear: req.body.manufactureYear,
            make: req.body.make,
            model: req.body.model,
            shape: req.body.shape,
            weight: req.body.weight
        }
        let plateNumber = 123 //CHANGE THIS
        let date = new Date()
        let year = date.getFullYear()
        let month = date.getMonth()
        let day = date.getDate()
        let regExpiry = new Date(year + 1, month, day).toISOString().slice(0, 10)
        let registration = { licenceNumber, vinNumber, vehicle, plateNumber, regExpiry }
        await storage.setItem(`vin-${registration.vinNumber}`.toString(), registration)
    
        let data = {registration, customer}
        
        

        res.json(data)
        // res.json({
        //     registration: registration,
        //     customer: customer
        // })

    })

    server.post('/api/registrations/search', async (req, res) => {
        let key = `vin-${req.body.searchTerm}`
        let registration = await storage.getItem(key)
        res.json(registration)
    })

    server.post('/api/registrations/customer/search', async (req, res) => {
        let licenceNumber = req.body.licenceNumber
        let result = await storage.valuesWithKeyMatch(licenceNumber)
        res.json(result)

    })

    server.delete('/api/registrations/:vin', async (req, res) => {
        let vehicleToCancel = req.params.vin
        let result = await storage.removeItem(`vin-${vehicleToCancel}`)
        res.json(result)
    })

    const PORT = process.env.PORT || 4000

    server.listen(PORT, () => console.log(`server is listening on ${PORT}`))

})();

