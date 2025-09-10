document.addEventListener("DOMContentLoaded", function() {
    const passInput=document.getElementById("password");
    const saveButton=document.getElementById("saveBtn");
    const strenghtBar=document.querySelector(".strength-bar");
    const feedBack=document.getElementById("feedback");
    passInput.addEventListener('input', updatePasswordStrength);
    function updatePasswordStrength(){
        const password = passInput.value;
        //console.log("kya mila ",password);
        let strength = 0;
        let feedback = '';
        if (password.length === 0) {
            feedback = 'Please start typing...';
        }
        else if (password.length < 6) {
            feedback = 'Too short!';
            strength = 20;    
        }
       
      
        else {
            strength = 50; // Base strength for length, yellow
            feedback = 'Getting better...';
            const hasNumber = /[0-9]/.test(password);
            const hasUpper = /[A-Z]/.test(password);
            const hasLower = /[a-z]/.test(password);
            const hasSpecial = /[^A-Za-z0-9]/.test(password);

            if (hasNumber) {
                strength += 10;
                feedback = 'Add uppercase or symbols.';

            }
            if(hasUpper){
                strength+=10;
                feedback="Add numbers or symbols";

            }
            if(hasSpecial){
                strength+=30;
                feedback=" strong password."
            }
            if((hasNumber&&hasSpecial&&hasUpper)||(hasNumber&&hasSpecial&&hasLower)||(hasNumber&&hasSpecial&&hasLower&&hasUpper)){
                strength=100;
                feedback= " Excellent! very strong password";
                saveButton.disabled=false;

            }
            else{
                saveButton.disabled=true;
            }

            
        }
        
        strenghtBar.style.width=strength+'%';
        if (strength < 40) {
            strenghtBar.style.backgroundColor = 'red';
        } else if (strength < 80) {
            strenghtBar.style.backgroundColor = 'orange';
        } else {
            strenghtBar.style.backgroundColor = 'green'; // Strong password
        }
        feedBack.textContent=feedback;

        if(strength>=75){
            saveButton.disabled=false;
        }
        else{
            saveButton.disabled=true;
        }



    }
    updatePasswordStrength();
    //saving strong passwords
    saveButton.addEventListener('click', savePasswordToFile);

    function savePasswordToFile(){
        const password = passInput.value;
        const fileContent = `Password\n${password}`;
        const blob = new Blob([fileContent], { type: 'text/csv' });

        
        const url =URL.createObjectURL(blob);
         const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        
        // Use a fixed filename to append to the same file
        a.download = 'saved_passwords.txt';
        
        // Programmatically click the link to trigger download
        document.body.appendChild(a);
        a.click();
        
        // Clean up
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(a.href);
        }, 100);
        
        // Reset the form
        passInput.value = '';
        updatePasswordStrength();
        
        // Show success message
        feedback.textContent = 'Password saved to file!';
        feedback.style.color = 'green';
        
        // Reset feedback color after 2 seconds
        setTimeout(() => {
            feedback.style.color = '';
        }, 2000);
        
        
    }
    savePasswordToFile();




   
     




})
