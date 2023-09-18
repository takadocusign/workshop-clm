const express = require("express");
const cors = require("cors");
const low = require("lowdb");
const FileSync = require("lowdb/adapters/FileSync");
const bodyParser = require("body-parser");
const port = process.env.PORT || 3000;

// Create a server
const app = express();
app.use(cors());

// Parse JSON data
app.use(bodyParser.json());

// Parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));

// Manually override the HTTP method if _method is 'delete'
app.use((req, res, next) => {
  if (req.body._method === "delete") {
    console.log("Manually overriding request method to DELETE");
    req.method = "DELETE";
  }
  next();
});

// Create a lowdb database
const adapter = new FileSync("db.json");
const db = low(adapter);

// Define some default data in case the database is empty
db.defaults({ providers: [] }).write();

// API endpoint to receive GET requests
app.get("/providers/search", (req, res) => {
  const { filter } = req.query;
  const filteredProviders = db
    .get("providers")
    .filter((provider) =>
      provider.nomeDaEmpresa.toLowerCase().includes(filter.toLowerCase())
    )
    .value();
  res.send(filteredProviders);
});

app
  .route("/providers")
  .post((req, res) => {
    console.log("POST request received at /providers.");
    db.get("providers").push(req.body).write();
    res.redirect("/providers");
  })
  .delete((req, res) => {
    console.log("DELETE request received at /providers.");
    const { cnpj } = req.body;
    db.get("providers").remove({ cnpj }).write();
    res.redirect("/providers");
  });

// Endpoint to view the database and search it through a "search field"
app.get("/providers", (req, res) => {
  const providers = db.get("providers").value();
  res.send(`
      <html>
      <head>
        <title>Customer Database</title>
        <!-- Include Bootstrap CSS -->
        <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css">
        <script>
          function confirmDelete() {
            return confirm('Você realmente deseja excluir este fornecedor?');
          }
        </script>
      </head>
      <body>
        <div class="container">
          <form action="/providers" method="post">
            <!-- Insert your form fields here -->
            <div class="form-group">
            <label for="nomeDaEmpresa">Nome da Empresa</label>
            <input type="text" class="form-control" id="nomeDaEmpresa" name="nomeDaEmpresa" required>
            </div>
            <div class="form-group">
                <label for="cnpj">CNPJ</label>
                <input type="text" class="form-control" id="cnpj" name="cnpj" required>
            </div>
            <div class="form-group">
                <label for="endereco">Endereço</label>
                <input type="text" class="form-control" id="endereco" name="endereco" required>
            </div>
            <div class="form-group">
                <label for="cidade">Cidade</label>
                <input type="text" class="form-control" id="cidade" name="cidade" required>
            </div>
            <div class="form-group">
                <label for="estado">Estado</label>
                <select class="form-control" id="estado" name="estado">
                  <option selected>Selecione...</option>
                  <option value="AC">AC</option>
                  <option value="AL">AL</option>
                  <option value="AP">AP</option>
                  <option value="AM">AM</option>
                  <option value="BA">BA</option>
                  <option value="CE">CE</option>
                  <option value="DF">DF</option>
                  <option value="ES">ES</option>
                  <option value="GO">GO</option>
                  <option value="MA">MA</option>
                  <option value="MT">MT</option>
                  <option value="MS">MS</option>
                  <option value="MG">MG</option>
                  <option value="PA">PA</option>
                  <option value="PB">PB</option>
                  <option value="PR">PR</option>
                  <option value="PE">PE</option>
                  <option value="PI">PI</option>
                  <option value="RJ">RJ</option>
                  <option value="RN">RN</option>
                  <option value="RS">RS</option>
                  <option value="RO">RO</option>
                  <option value="RR">RR</option>
                  <option value="SC">SC</option>
                  <option value="SP">SP</option>
                  <option value="SE">SE</option>
                  <option value="TO">TO</option>
              </select>
            </div>
            <div class="form-group">
                <label for="cep">CEP</label>
                <input type="text" class="form-control" id="cep" name="cep" required>
            </div>
            <div class="form-group">
                <label for="nomeDoRepresentante">Nome do Representante</label>
                <input type="text" class="form-control" id="nomeDoRepresentante" name="nomeDoRepresentante" required>
            </div>
            <div class="form-group">
                <label for="emailDoRepresentante">E-mail do Representante</label>
                <input type="email" class="form-control" id="emailDoRepresentante" name="emailDoRepresentante" required>
            </div>
            <button type="submit" class="btn btn-primary">Registrar</button>
          </form>
          <table class="table">
            <thead>
              <tr>
                <th scope="col">Nome da Empresa</th>
                <th scope="col">CNPJ</th>
                <th scope="col">Endereço</th>
                <th scope="col">Cidade</th>
                <th scope="col">Estado</th>
                <th scope="col">CEP</th>
                <th scope="col">Nome do Representante</th>
                <th scope="col">E-mail do Representante</th>
                <th scope="col"></th>
              </tr>
            </thead>
            <tbody>
              ${providers
                .map(
                  (provider) => `
              <tr>
                <td>${provider.nomeDaEmpresa}</td>
                <td>${provider.cnpj}</td>
                <td>${provider.endereco}</td>
                <td>${provider.cidade}</td>
                <td>${provider.estado}</td>
                <td>${provider.cep}</td>
                <td>${provider.nomeDoRepresentante}</td>
                <td>${provider.emailDoRepresentante}</td>
                <td>
                  <form action="/providers" method="post" onsubmit="return confirmDelete();">
                    <input type="hidden" name="_method" value="delete" />
                    <input type="hidden" name="cnpj" value="${provider.cnpj}" />
                    <button type="submit" class="btn btn-danger">Excluir</button>
                  </form>
                </td>
              </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
        </div>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/vanilla-masker/1.2.0/vanilla-masker.min.js"></script>
        <script>
            // Apply the masks to the cnpj and cep fields
            var cnpjField = document.getElementById('cnpj');
            var cepField = document.getElementById('cep');
            VMasker(cnpjField).maskPattern('99.999.999/9999-99');
            VMasker(cepField).maskPattern('99999-999');
        </script>
      </body>
      </html>
    `);
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
