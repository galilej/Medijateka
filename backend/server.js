// Uvoz potrebnih modula
const express = require("express"); // Uvoz Express framework-a
const fs = require("fs"); // Uvoz File System modula za rad sa datotekama
const cors = require("cors"); // Uvoz CORS (Cross-Origin Resource Sharing) modula

// Kreiranje nove Express aplikacije
const app = express();
const port = 3000; // Definisanje porta na kojem će se server pokretati

// Postavke za CORS da bi se omogućilo deljenje resursa među različitim domenima
const corsOptions = {
  origin: "http://localhost:4200", // Dozvoljava zahteve samo sa ove lokacije
  optionsSuccessStatus: 204, // Statusni kod za uspešne OPTIONS zahteve
  methods: "GET, POST, PUT, DELETE", // Dozvoljene metode za CORS zahteve
};

app.use(cors(corsOptions)); // Koristi CORS sa predefinisanim opcijama

app.use(express.json()); // Omogućava parsiranje JSON tela zahteve

// GET zahtev za dohvatanje podataka o odeći
app.get("/clothes", (req, res) => {
  const page = parseInt(req.query.page) || 0; // Dohvatanje trenutne stranice iz upita
  const perPage = parseInt(req.query.perPage) || 10; // Dohvatanje broja stavki po stranici iz upita

  fs.readFile("db.json", "utf8", (err, data) => { // Čitanje iz JSON baze podataka
    if (err) {
      console.log(err);
      res.status(500).send("Internal Server Error");
      return;
    }

    const jsonData = JSON.parse(data); // Parsiranje pročitanog teksta u JSON

    // Izračunavanje početne i krajnje tačke za paginaciju
    const start = page * perPage;
    const end = start + perPage;

    // Dohvatanje odgovarajućih stavki za trenutnu stranicu
    const result = jsonData.items.slice(start, end);

    // Slanje rezultata nazad klijentu
    res.status(200).json({
      items: result,
      total: jsonData.items.length,
      page,
      perPage,
      totalPages: Math.ceil(jsonData.items.length / perPage),
    });
  });
});

// POST zahtev za dodavanje nove stavke odeće
app.post("/clothes", (req, res) => {
  const { image, name, price, rating } = req.body; // Dohvatanje podataka iz tela zahteva

  fs.readFile("db.json", "utf8", (err, data) => { // Čitanje iz JSON baze podataka
    if (err) {
      console.log(err);
      res.status(500).send("Internal Server Error");
      return;
    }

    const jsonData = JSON.parse(data);

    // Pronalaženje najvećeg ID-a i dodavanje jedan za novi ID
    const maxId = jsonData.items.reduce(
      (max, item) => Math.max(max, item.id),
      0
    );

    const newItem = { id: maxId + 1, image, name, price, rating };

    jsonData.items.push(newItem); // Dodavanje nove stavke u bazu

    fs.writeFile("db.json", JSON.stringify(jsonData), (err) => { // Upisivanje ažuriranih podataka u bazu
      if (err) {
        console.log(err);
        res.status(500).send("Internal Server Error");
        return;
      }

      res.status(201).json(newItem); // Slanje novokreirane stavke kao odgovora
    });
  });
});

// PUT zahtev za ažuriranje postojeće stavke odeće
app.put("/clothes/:id", (req, res) => {
  const id = parseInt(req.params.id); // Dohvatanje ID-a stavke iz parametra puta
  const { image, name, price, rating } = req.body; // Dohvatanje ažuriranih podataka iz tela zahteva

  fs.readFile("db.json", "utf8", (err, data) => {
    if (err) {
      console.log(err);
      res.status(500).send("Internal Server Error");
      return;
    }

    const jsonData = JSON.parse(data);
    const index = jsonData.items.findIndex((item) => item.id === id); // Pronalaženje indeksa stavke za ažuriranje

    if (index === -1) { // Ako stavka nije pronađena
      res.status(404).send("Not Found");
      return;
    }

    // Ažuriranje stavke
    jsonData.items[index] = { id, image, name, price, rating };

    fs.writeFile("db.json", JSON.stringify(jsonData), (err) => { // Upisivanje ažuriranih podataka u bazu
      if (err) {
        console.log(err);
        res.status(500).send("Internal Server Error");
        return;
      }

      res.status(200).json(jsonData.items[index]); // Slanje ažurirane stavke kao odgovora
    });
  });
});

// DELETE zahtev za brisanje stavke odeće
app.delete("/clothes/:id", (req, res) => {
  const id = parseInt(req.params.id); // Dohvatanje ID-a stavke iz parametra puta

  fs.readFile("db.json", "utf8", (err, data) => {
    if (err) {
      console.log(err);
      res.status(500).send("Internal Server Error");
      return;
    }

    const jsonData = JSON.parse(data);
    const index = jsonData.items.findIndex((item) => item.id === id); // Pronalaženje indeksa stavke za brisanje

    if (index === -1) { // Ako stavka nije pronađena
      res.status(404).send("Not Found");
      return;
    }

    jsonData.items.splice(index, 1); // Brisanje stavke iz niza

    fs.writeFile("db.json", JSON.stringify(jsonData), (err) => { // Upisivanje ažuriranih podataka u bazu
      if (err) {
        console.log(err);
        res.status(500).send("Internal Server Error");
        return;
      }

      res.status(204).send(); // Slanje praznog odgovora sa statusom 204 (No Content)
    });
  });
});

// Pokretanje servera
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
