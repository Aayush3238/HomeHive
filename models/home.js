const fs = require('fs');
const path = require('path');

const rootDir = require('../utils/pathUtils');

const SubmittedDetails = [];

module.exports = class Home{
    constructor(address, price, homeImage){
        this.address = address;
        this.price = price;
        this.homeImage = homeImage;
    }
        
    save(){
        // SubmittedDetails.push(this);
        this.id = Math.random().toString();
        Home.fetchAll((SubmittedDetails) => {
            SubmittedDetails.push(this);
            fs.writeFileSync(path.join(rootDir, 'data', 'homes.json'), JSON.stringify(SubmittedDetails));
        }) 
        

    }

    static fetchAll(callback){
        const homeDataPath = path.join(rootDir, 'data', 'homes.json');
        fs.readFile(homeDataPath, (err, data) => {
            if(err){
                return callback([]);
            }
            else{
                return callback(JSON.parse(data));
            }
        });
    }
}

