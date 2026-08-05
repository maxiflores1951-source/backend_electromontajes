require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./src/routes/authRoutes');
const proveedorRoutes = require('./src/routes/proveedorRoutes');
const sitfiscalRoutes = require('./src/routes/sitfiscalRoutes');
const personalRoutes = require('./src/routes/personalRoutes');
const articuloRoutes = require('./src/routes/articuloRoutes');
const familiaHerramientaRoutes = require('./src/routes/familiaHerramientaRoutes');
const familiaArticuloRoutes = require('./src/routes/familiaArticuloRoutes');
const marcaRoutes = require('./src/routes/marcaRoutes');
const familiaUnidadRoutes = require('./src/routes/familiaUnidadRoutes');
const movimientoRoutes = require('./src/routes/movimientoRoutes');
const lugarRoutes = require('./src/routes/lugarRoutes');
const herramientaRoutes = require('./src/routes/herramientaRoutes');
const herramientaMovimientoRoutes = require('./src/routes/herramientaMovimientoRoutes');

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));

app.use('/', authRoutes); // URL final: POST /login
app.use('/proveedor', proveedorRoutes);
app.use('/sitfiscal', sitfiscalRoutes);
app.use('/personal', personalRoutes);
app.use('/articulos', articuloRoutes);
app.use('/familiaherramienta', familiaHerramientaRoutes);
app.use('/familiarticulos', familiaArticuloRoutes);
app.use('/marca', marcaRoutes);
app.use('/marcas', marcaRoutes);
app.use('/familiaunidad', familiaUnidadRoutes);
app.use('/movimientostock', movimientoRoutes);
app.use('/lugares', lugarRoutes);
app.use('/herramienta', herramientaRoutes);
app.use('/herramientas', herramientaRoutes);
app.use('/movimientosherramientas', herramientaMovimientoRoutes);

const PORT = process.env.PORT || 3400;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor corriendo en http://0.0.0.0:${PORT}`);
  console.log(`Endpoint: POST /login`);
});