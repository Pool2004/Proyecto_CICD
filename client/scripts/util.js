document.addEventListener('DOMContentLoaded', () => {
    
    
    const login = async() => {


        const url = "https://testapiproject.onrender.com/login";

        const usuario = document.getElementById('username').value;
        const contrasena = document.getElementById('password').value;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username: usuario, password: contrasena })
        });

        const result = await response.json();

        if(result.status_code == 200){
            localStorage.setItem('token', result.token);
            window.location.href = '../client/views/dashboard.html';
        }else{
            alert('Error de autenticación: ' + result.mensaje);
        }
    }


    document.getElementById('login-form').addEventListener('submit', (e) => {
        e.preventDefault();
        login();
    });
});
