import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("fuel_management.db");

// Initialize Database Schema
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    role TEXT -- admin, economia, operador, transporte, consultor
  );

  CREATE TABLE IF NOT EXISTS deposits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    responsible TEXT
  );

  CREATE TABLE IF NOT EXISTS fuel_types (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT, -- Diesel, Gasoline, etc.
    price_ecosistema REAL DEFAULT 0,
    price_externo REAL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS drivers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT,
    fleet TEXT -- TL38, Yeya, 25MN
  );

  CREATE TABLE IF NOT EXISTS vehicles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    model TEXT,
    brand TEXT,
    fuel_type_id INTEGER,
    ic TEXT,
    tank_capacity REAL,
    plate TEXT UNIQUE,
    FOREIGN KEY(fuel_type_id) REFERENCES fuel_types(id)
  );

  CREATE TABLE IF NOT EXISTS clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    type TEXT -- Negocio, Vehículo
  );

  CREATE TABLE IF NOT EXISTS movements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT, -- entry, consumption, sale, loan, adjustment_in, adjustment_out
    status TEXT DEFAULT 'draft', -- draft, processed
    date TEXT,
    deposit_id INTEGER,
    fuel_type_id INTEGER,
    quantity REAL,
    um TEXT, -- Lts, etc.
    price REAL,
    
    -- Entry specific
    provider TEXT,
    
    -- Consumption specific
    vehicle_id INTEGER,
    driver_id INTEGER,
    activity TEXT,
    op_number TEXT,
    
    -- Sale/Loan specific
    client_id INTEGER,
    receiver_name TEXT,
    observations TEXT,
    
    FOREIGN KEY(deposit_id) REFERENCES deposits(id),
    FOREIGN KEY(fuel_type_id) REFERENCES fuel_types(id),
    FOREIGN KEY(vehicle_id) REFERENCES vehicles(id),
    FOREIGN KEY(driver_id) REFERENCES drivers(id),
    FOREIGN KEY(client_id) REFERENCES clients(id)
  );

  CREATE TABLE IF NOT EXISTS requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT,
    requester_id INTEGER,
    fuel_type_id INTEGER,
    quantity REAL,
    status TEXT, -- pending, approved, rejected
    FOREIGN KEY(fuel_type_id) REFERENCES fuel_types(id)
  );
`);

// Migration: Add status column to movements if it doesn't exist
try {
  db.prepare("ALTER TABLE movements ADD COLUMN status TEXT DEFAULT 'draft'").run();
} catch (e) {}

// Migration: Add location column to deposits if it doesn't exist
try {
  db.prepare("ALTER TABLE deposits ADD COLUMN location TEXT").run();
} catch (e) {}

// Migration: Add price columns to fuel_types if they don't exist
try {
  db.prepare("ALTER TABLE fuel_types ADD COLUMN price_ecosistema REAL DEFAULT 0").run();
} catch (e) {}
try {
  db.prepare("ALTER TABLE fuel_types ADD COLUMN price_externo REAL DEFAULT 0").run();
} catch (e) {}

// Seed initial data if empty
const userCount = db.prepare("SELECT count(*) as count FROM users").get() as { count: number };
if (userCount.count === 0) {
  db.prepare("INSERT INTO users (username, password, role) VALUES (?, ?, ?)").run("admin", "admin", "admin");
  db.prepare("INSERT INTO users (username, password, role) VALUES (?, ?, ?)").run("eco", "eco", "economia");
  db.prepare("INSERT INTO users (username, password, role) VALUES (?, ?, ?)").run("ope", "ope", "operador");
  db.prepare("INSERT INTO users (username, password, role) VALUES (?, ?, ?)").run("trans", "trans", "transporte");
  db.prepare("INSERT INTO users (username, password, role) VALUES (?, ?, ?)").run("cons", "cons", "consultor");
  
  db.prepare("INSERT INTO fuel_types (name) VALUES (?)").run("Diesel");
  db.prepare("INSERT INTO fuel_types (name) VALUES (?)").run("Gasolina");
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // API Routes
  app.post("/api/login", (req, res) => {
    const { username, password } = req.body;
    const user = db.prepare("SELECT * FROM users WHERE username = ? AND password = ?").get(username, password);
    if (user) {
      res.json(user);
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  });

  app.get("/api/users", (req, res) => {
    res.json(db.prepare("SELECT id, username, role FROM users").all());
  });

  app.post("/api/users", (req, res) => {
    const { username, password, role } = req.body;
    try {
      const info = db.prepare("INSERT INTO users (username, password, role) VALUES (?, ?, ?)").run(username, password, role);
      res.json({ id: info.lastInsertRowid });
    } catch (e) {
      res.status(400).json({ error: "Username already exists" });
    }
  });

  app.get("/api/deposits", (req, res) => res.json(db.prepare("SELECT * FROM deposits").all()));
  app.post("/api/deposits", (req, res) => {
    const { name, responsible, location } = req.body;
    const info = db.prepare("INSERT INTO deposits (name, responsible, location) VALUES (?, ?, ?)").run(name, responsible, location);
    res.json({ id: info.lastInsertRowid });
  });

  app.put("/api/deposits/:id", (req, res) => {
    const { name, responsible, location } = req.body;
    db.prepare("UPDATE deposits SET name = ?, responsible = ?, location = ? WHERE id = ?").run(name, responsible, location, req.params.id);
    res.json({ success: true });
  });

  app.get("/api/fuel-types", (req, res) => res.json(db.prepare("SELECT * FROM fuel_types").all()));
  app.post("/api/fuel-types", (req, res) => {
    const { name, price_ecosistema, price_externo } = req.body;
    const info = db.prepare("INSERT INTO fuel_types (name, price_ecosistema, price_externo) VALUES (?, ?, ?)").run(name, price_ecosistema || 0, price_externo || 0);
    res.json({ id: info.lastInsertRowid });
  });
  app.put("/api/fuel-types/:id", (req, res) => {
    const { name, price_ecosistema, price_externo } = req.body;
    db.prepare("UPDATE fuel_types SET name = ?, price_ecosistema = ?, price_externo = ? WHERE id = ?").run(name, price_ecosistema || 0, price_externo || 0, req.params.id);
    res.json({ success: true });
  });

  app.get("/api/drivers", (req, res) => res.json(db.prepare("SELECT * FROM drivers").all()));
  app.post("/api/drivers", (req, res) => {
    const { full_name, fleet } = req.body;
    const info = db.prepare("INSERT INTO drivers (full_name, fleet) VALUES (?, ?)").run(full_name, fleet);
    res.json({ id: info.lastInsertRowid });
  });

  app.get("/api/vehicles", (req, res) => {
    res.json(db.prepare(`
      SELECT v.*, f.name as fuel_type_name 
      FROM vehicles v 
      JOIN fuel_types f ON v.fuel_type_id = f.id
    `).all());
  });
  app.post("/api/vehicles", (req, res) => {
    const { model, brand, fuel_type_id, ic, tank_capacity, plate } = req.body;
    const info = db.prepare("INSERT INTO vehicles (model, brand, fuel_type_id, ic, tank_capacity, plate) VALUES (?, ?, ?, ?, ?, ?)").run(model, brand, fuel_type_id, ic, tank_capacity, plate);
    res.json({ id: info.lastInsertRowid });
  });

  app.get("/api/clients", (req, res) => res.json(db.prepare("SELECT * FROM clients").all()));
  app.post("/api/clients", (req, res) => {
    const { name, type } = req.body;
    const info = db.prepare("INSERT INTO clients (name, type) VALUES (?, ?)").run(name, type);
    res.json({ id: info.lastInsertRowid });
  });

  app.get("/api/movements", (req, res) => {
    res.json(db.prepare(`
      SELECT m.*, d.name as deposit_name, f.name as fuel_type_name, v.plate, dr.full_name as driver_name, c.name as client_name
      FROM movements m
      LEFT JOIN deposits d ON m.deposit_id = d.id
      LEFT JOIN fuel_types f ON m.fuel_type_id = f.id
      LEFT JOIN vehicles v ON m.vehicle_id = v.id
      LEFT JOIN drivers dr ON m.driver_id = dr.id
      LEFT JOIN clients c ON m.client_id = c.id
      ORDER BY m.date DESC
    `).all());
  });

  app.post("/api/movements", (req, res) => {
    const m = req.body;
    const op_number = m.type === 'consumption' ? `OP-${Date.now()}` : null;
    const info = db.prepare(`
      INSERT INTO movements (
        type, status, date, deposit_id, fuel_type_id, quantity, um, price, 
        provider, vehicle_id, driver_id, activity, op_number, 
        client_id, receiver_name, observations
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      m.type, 'draft', m.date, m.deposit_id, m.fuel_type_id, m.quantity, m.um, m.price,
      m.provider, m.vehicle_id, m.driver_id, m.activity, op_number,
      m.client_id, m.receiver_name, m.observations
    );
    res.json({ id: info.lastInsertRowid, op_number });
  });

  app.put("/api/movements/:id", (req, res) => {
    const m = req.body;
    const current = db.prepare("SELECT status FROM movements WHERE id = ?").get(req.params.id) as any;
    if (current?.status === 'processed') {
      return res.status(403).json({ error: "Cannot edit processed movement" });
    }

    db.prepare(`
      UPDATE movements SET 
        date = ?, deposit_id = ?, fuel_type_id = ?, quantity = ?, um = ?, price = ?, 
        provider = ?, vehicle_id = ?, driver_id = ?, activity = ?, 
        client_id = ?, receiver_name = ?, observations = ?, status = ?
      WHERE id = ?
    `).run(
      m.date, m.deposit_id, m.fuel_type_id, m.quantity, m.um, m.price,
      m.provider, m.vehicle_id, m.driver_id, m.activity,
      m.client_id, m.receiver_name, m.observations, m.status || 'draft',
      req.params.id
    );
    res.json({ success: true });
  });

  app.delete("/api/movements/:id", (req, res) => {
    const current = db.prepare("SELECT status FROM movements WHERE id = ?").get(req.params.id) as any;
    if (current?.status === 'processed') {
      return res.status(403).json({ error: "Cannot delete processed movement" });
    }
    db.prepare("DELETE FROM movements WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // Generic Update Routes for other entities
  app.put("/api/drivers/:id", (req, res) => {
    const { full_name, fleet } = req.body;
    db.prepare("UPDATE drivers SET full_name = ?, fleet = ? WHERE id = ?").run(full_name, fleet, req.params.id);
    res.json({ success: true });
  });

  app.put("/api/vehicles/:id", (req, res) => {
    const { model, brand, fuel_type_id, ic, tank_capacity, plate } = req.body;
    db.prepare("UPDATE vehicles SET model = ?, brand = ?, fuel_type_id = ?, ic = ?, tank_capacity = ?, plate = ? WHERE id = ?")
      .run(model, brand, fuel_type_id, ic, tank_capacity, plate, req.params.id);
    res.json({ success: true });
  });

  app.put("/api/clients/:id", (req, res) => {
    const { name, type } = req.body;
    db.prepare("UPDATE clients SET name = ?, type = ? WHERE id = ?").run(name, type, req.params.id);
    res.json({ success: true });
  });

  app.get("/api/requests", (req, res) => {
    res.json(db.prepare(`
      SELECT r.*, f.name as fuel_type_name
      FROM requests r
      JOIN fuel_types f ON r.fuel_type_id = f.id
    `).all());
  });

  app.post("/api/requests", (req, res) => {
    const { date, requester_id, fuel_type_id, quantity } = req.body;
    const info = db.prepare("INSERT INTO requests (date, requester_id, fuel_type_id, quantity, status) VALUES (?, ?, ?, ?, ?)").run(date, requester_id, fuel_type_id, quantity, 'pending');
    res.json({ id: info.lastInsertRowid });
  });

  app.patch("/api/requests/:id", (req, res) => {
    const { status } = req.body;
    db.prepare("UPDATE requests SET status = ? WHERE id = ?").run(status, req.params.id);
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  const PORT = 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
