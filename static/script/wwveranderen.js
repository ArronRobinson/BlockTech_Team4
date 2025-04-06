document.getElementById("wachtwoordVeranderenForm").addEventListener("submit", async function (event) {
    event.preventDefault(); // Voorkomt standaard form-verzending

    const gebruikersnaam = document.getElementById("naam").value;
    const wachtwoord = document.getElementById("nieuwWachtwoord").value;

    const response = await fetch("/wachtwoordveranderen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: gebruikersnaam, password: wachtwoord })
    });

    const data = await response.json();
    alert(data.message);
});