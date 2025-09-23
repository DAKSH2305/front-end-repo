import readline from 'readline'
import fs from 'fs';
const rl=readline.createInterface({
    input:process.stdin,
    output:process.stdout
})
const fileCreation=()=>{
    rl.question('enter your filename :',(filename)=>{
        rl.question("enter the content for your file : ",(content)=>{
            fs.writeFile(`${filename}.txt`,content,(err)=>{
                if(err){
                    console.error("error while making a file");
                }
                else{
                    console.log(`file "${filename}.txt" created succesfully ! `)
                }
                
                rl.close();

            })
        })
    })
}
fileCreation();