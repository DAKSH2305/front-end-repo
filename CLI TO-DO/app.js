import readline from "readline";
const rl=readline.createInterface({
    input:process.stdin,
    output:process.stdout
})
const todos=[];
const showMenu=()=>{
    console.log("\n1. Add a task");
    console.log("2.view a task");
    console.log("3.exit");

    rl.question("choose an option : ",handleInput)
}

const handleInput=(option)=>{
    if(option==='1'){
        rl.question("enter the task: ",(task)=>{
            todos.push(task);
            console.log("task added : ", task);
            showMenu();
        })
    }
    else if(option==='2'){
        console.log("\n Your ToDo list");
        todos.forEach((task,index)=>{
            console.log(`${index+1}.${task}`);
        })
        showMenu();
        
    }
    else if(option==="3"){
        console.log("good byee!!");
        rl.close()
    }
    else{
        console.log("invalid selection");
        showMenu();
    }

}
showMenu();