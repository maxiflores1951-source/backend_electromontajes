-- Tabla de relacion entre Nota de Credito de Venta y Factura de Venta
-- Ejecutar en la base de datos electromontajes2

CREATE TABLE IF NOT EXISTS `imputacion_nota_venta_factura_venta` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `codigo_nota_credito_venta` varchar(20) NOT NULL,
  `codigo_factura_venta` varchar(20) NOT NULL,
  `importe` decimal(15,2) NOT NULL DEFAULT 0.00,
  `fecha_creacion` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_ncv` (`codigo_nota_credito_venta`),
  KEY `idx_fv` (`codigo_factura_venta`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
