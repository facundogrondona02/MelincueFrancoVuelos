export default async function recorroListaVuelos(page) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10, _11, _12, _13, _14, _15, _16;
    await page.mouse.wheel(0, 1000);
    // Esperás un poco para que cargue lo que aparece tras el scroll
    const tablaBody = page.locator('//*[@id="content"]/div/div[2]/table/tbody');
    await tablaBody.waitFor({ state: 'attached' });
    await tablaBody.waitFor({ state: 'attached' });
    const totalBodies = await tablaBody.count();
    for (let i = 0; i < totalBodies; i++) {
        const isVisible = await tablaBody.nth(i).isVisible();
        console.log(`tbody ${i} visible?`, isVisible);
    }
    // Obtenemos solo las filas visibles
    const filasVisibles = page.locator('tr:visible');
    const cantidadFilas = await filasVisibles.count();
    // let precioFinal = ""
    const vueloFinal = {
        precioFinal: "",
        aeropuertoIda: "",
        horarioSalidaIda: "",
        ciudadOrigenIda: "",
        horarioSupongoDuracionIda: "",
        escalasIda: "",
        // horarioSupongoLlegadaIda: "",
        aeropuertoDestinoIda: "",
        ciudadDestinoIda: "",
        aeropuertoVuelta: "",
        horarioSalidaVuelta: "",
        ciudadOrigenVuelta: "",
        horarioSupongoDuracionVuelta: "",
        escalasVuelta: "",
        // horarioSupongoLlegadaVuelta: "",
        aeropuertoDestinoVuelta: "",
        ciudadDestinoVuelta: "",
        aerolinea: "",
        fechaSalidaIda: "",
        fechaLlegadaIda: "",
        fechaSalidaVuelta: "",
        fechaLlegadaVuelta: "",
        fechaLlegadaIdaEscala: "",
        fechaSalidaIdaEscala: "",
        fechaLlegadaVueltaEscala: "",
        fechaSalidaVueltaEscala: "",
        horarioLlegadaIdaEscala: "",
        horarioSalidaIdaEscala: "",
        horarioLlegadaIda: "",
        horarioLlegadaVueltaEscala: "",
        horarioSalidaVueltaEscala: "",
        horarioLlegadaVuelta: "",
        adults: 0,
        children: 0,
        infants: 0
    };
    for (let i = 0; i < cantidadFilas; i++) {
        const fila = filasVisibles.nth(i);
        const contenedor = fila.locator('.baggage-cont');
        try {
            // const equipajeMano = contenedor.locator('.baggage.hand').first();
            const equipajeCarrion = contenedor.locator('.baggage.carry-on').first();
            const equipajeBodega = contenedor.locator('.baggage.dispatch').first();
            // const tieneMano = (await equipajeMano.getAttribute('class'))?.includes('included') ?? false;
            const tieneCarrion = (_b = (_a = (await equipajeCarrion.getAttribute('class'))) === null || _a === void 0 ? void 0 : _a.includes('included')) !== null && _b !== void 0 ? _b : false;
            const tieneBodega = (_d = (_c = (await equipajeBodega.getAttribute('class'))) === null || _c === void 0 ? void 0 : _c.includes('included')) !== null && _d !== void 0 ? _d : false;
            if (tieneCarrion || tieneBodega) {
                const strongLocator = fila.locator('strong.priceNumb');
                vueloFinal.precioFinal = (_e = (await strongLocator.textContent())) !== null && _e !== void 0 ? _e : "";
                vueloFinal.aeropuertoIda = (_f = (await fila.locator('//*[@id="showDetail"]/div[1]/div[2]/div[1]/div[1]/span[1]').textContent())) !== null && _f !== void 0 ? _f : "";
                // vueloFinal.horarioSalidaIda = (await fila.locator('//*[@id="showDetail"]/div[1]/div[2]/div[1]/div[1]/span[2]/strong').textContent()) ?? "";
                vueloFinal.ciudadOrigenIda = (_g = (await fila.locator('//*[@id="showDetail"]/div[1]/div[2]/div[1]/div[2]/span').textContent())) !== null && _g !== void 0 ? _g : "";
                vueloFinal.horarioSupongoDuracionIda = (_h = (await fila.locator('//*[@id="showDetail"]/div[1]/div[2]/div[2]/span[1]').textContent())) !== null && _h !== void 0 ? _h : "";
                vueloFinal.escalasIda = (_j = (await fila.locator('//*[@id="showDetail"]/div[1]/div[2]/div[2]/span[2]').textContent())) !== null && _j !== void 0 ? _j : "";
                // vueloFinal.horarioSupongoLlegadaIda = (await fila.locator('//*[@id="showDetail"]/div[1]/div[2]/div[3]/div[1]/span[1]/strong').textContent()) ?? "";
                const nodoCityLocator = fila.locator('//*[@id="showDetail"]/div[1]/div[2]/div[3]/div[1]/span[2]');
                const handle = await nodoCityLocator.elementHandle();
                const mad = await (handle === null || handle === void 0 ? void 0 : handle.evaluate(el => { var _a, _b, _c; return (_c = (_b = (_a = el.childNodes[0]) === null || _a === void 0 ? void 0 : _a.nodeValue) === null || _b === void 0 ? void 0 : _b.trim()) !== null && _c !== void 0 ? _c : ""; }));
                vueloFinal.aeropuertoDestinoIda = mad !== null && mad !== void 0 ? mad : "";
                vueloFinal.ciudadDestinoIda = (_k = (await fila.locator('//*[@id="showDetail"]/div[1]/div[2]/div[3]/div[2]/span').textContent())) !== null && _k !== void 0 ? _k : "";
                vueloFinal.aeropuertoVuelta = (_l = (await fila.locator('//*[@id="showDetail"]/div[3]/div[2]/div[1]/div[1]/span[1]').textContent())) !== null && _l !== void 0 ? _l : "";
                vueloFinal.horarioSalidaVuelta = (_m = (await fila.locator('//*[@id="showDetail"]/div[3]/div[2]/div[1]/div[1]/span[2]').textContent())) !== null && _m !== void 0 ? _m : "";
                vueloFinal.ciudadOrigenVuelta = (_o = (await fila.locator('//*[@id="showDetail"]/div[3]/div[2]/div[1]/div[2]/span').textContent())) !== null && _o !== void 0 ? _o : "";
                vueloFinal.horarioSupongoDuracionVuelta = (_p = (await fila.locator('//*[@id="showDetail"]/div[3]/div[2]/div[2]/span[1]').textContent())) !== null && _p !== void 0 ? _p : "";
                vueloFinal.escalasVuelta = (_q = (await fila.locator('//*[@id="showDetail"]/div[3]/div[2]/div[2]/span[2]').textContent())) !== null && _q !== void 0 ? _q : "";
                // vueloFinal.horarioSupongoLlegadaVuelta = (await fila.locator('//*[@id="showDetail"]/div[3]/div[2]/div[3]/div[1]/span[1]/strong').textContent()) ?? "";
                // vueloFinal.aeropuertoDestinoVuelta = (await fila.locator('//*[@id="showDetail"]/div[3]/div[2]/div[3]/div[1]/span[2]').textContent()) ?? "";
                const nodoCityLocatorVuelta = fila.locator('//*[@id="showDetail"]/div[3]/div[2]/div[3]/div[1]/span[2]');
                const handleVuelta = await nodoCityLocatorVuelta.elementHandle();
                const madVuelta = await (handleVuelta === null || handleVuelta === void 0 ? void 0 : handleVuelta.evaluate(el => { var _a, _b, _c; return (_c = (_b = (_a = el.childNodes[0]) === null || _a === void 0 ? void 0 : _a.nodeValue) === null || _b === void 0 ? void 0 : _b.trim()) !== null && _c !== void 0 ? _c : ""; }));
                vueloFinal.aeropuertoDestinoVuelta = madVuelta !== null && madVuelta !== void 0 ? madVuelta : "";
                vueloFinal.ciudadDestinoVuelta = (_r = (await fila.locator('//*[@id="showDetail"]/div[3]/div[2]/div[3]/div[2]/span').textContent())) !== null && _r !== void 0 ? _r : "";
                vueloFinal.aerolinea = (_s = (await fila.locator('//*[@id="showDetail"]/div[3]/div[1]/img').getAttribute('title'))) !== null && _s !== void 0 ? _s : "";
                await fila.locator('text=Ver Detalle').click();
                // // Esperar que aparezca la info expandida
                await page.waitForTimeout(4000);
                const bloquesVuelo = await fila.locator('#flight-detail-information').all();
                if (bloquesVuelo.length >= 2) {
                    // 👉 Primer bloque: IDA
                    const ida = bloquesVuelo[0];
                    const fechasIda = ida.locator('p.leg-departure-date >> strong');
                    const horarios = ida.locator('strong.leg-departure-time >> span');
                    console.log("cantidad de strong ", await fechasIda.count());
                    if (await fechasIda.count() <= 2) {
                        const fechaSalidaIda = (_t = await fechasIda.first().textContent()) !== null && _t !== void 0 ? _t : "";
                        const fechaLlegadaIda = (_u = await fechasIda.last().textContent()) !== null && _u !== void 0 ? _u : "";
                        const horarioSalidaIda = (_v = await horarios.first().textContent()) !== null && _v !== void 0 ? _v : "";
                        const horarioLlegadaIda = (_w = await horarios.last().textContent()) !== null && _w !== void 0 ? _w : "";
                        vueloFinal.fechaSalidaIda = fechaSalidaIda;
                        vueloFinal.fechaLlegadaIda = fechaLlegadaIda;
                        vueloFinal.horarioSalidaIda = horarioSalidaIda;
                        vueloFinal.horarioLlegadaIda = horarioLlegadaIda;
                    }
                    else {
                        const fechaSalidaIda = (_x = await fechasIda.first().textContent()) !== null && _x !== void 0 ? _x : "";
                        const fechaLlegadaIda = (_y = await fechasIda.last().textContent()) !== null && _y !== void 0 ? _y : "";
                        const horarioSalidaIda = (_z = await horarios.first().textContent()) !== null && _z !== void 0 ? _z : "";
                        const horarioLlegadaIda = (_0 = await horarios.last().textContent()) !== null && _0 !== void 0 ? _0 : "";
                        //si hay 1 escala, las fechas y horarios de la escala
                        const fechaLlegadaIdaEscala = (_1 = await fechasIda.nth(1).textContent()) !== null && _1 !== void 0 ? _1 : "";
                        const fechaSalidaIdaEscala = (_2 = await fechasIda.nth(2).textContent()) !== null && _2 !== void 0 ? _2 : "";
                        const horarioLlegadaIdaEscala = (_3 = await horarios.nth(1).textContent()) !== null && _3 !== void 0 ? _3 : "";
                        const horarioSalidaIdaEscala = (_4 = await horarios.nth(2).textContent()) !== null && _4 !== void 0 ? _4 : "";
                        vueloFinal.fechaSalidaIda = fechaSalidaIda;
                        vueloFinal.fechaLlegadaIda = fechaLlegadaIda;
                        vueloFinal.horarioSalidaIda = horarioSalidaIda;
                        vueloFinal.horarioLlegadaIda = horarioLlegadaIda;
                        vueloFinal.fechaLlegadaIdaEscala = fechaLlegadaIdaEscala;
                        vueloFinal.fechaSalidaIdaEscala = fechaSalidaIdaEscala;
                        vueloFinal.horarioLlegadaIdaEscala = horarioLlegadaIdaEscala;
                        vueloFinal.horarioSalidaIdaEscala = horarioSalidaIdaEscala;
                    }
                    // 👉 Segundo bloque: VUELTA
                    const vuelta = bloquesVuelo[1];
                    const fechasVuelta = vuelta.locator('p.leg-departure-date >> strong');
                    const horariosVuelta = vuelta.locator('strong.leg-departure-time >> span');
                    if (await fechasVuelta.count() <= 2) {
                        const fechaSalidaVuelta = (_5 = await fechasVuelta.first().textContent()) !== null && _5 !== void 0 ? _5 : "";
                        const fechaLlegadaVuelta = (_6 = await fechasVuelta.last().textContent()) !== null && _6 !== void 0 ? _6 : "";
                        const horarioSalidaVuelta = (_7 = await horariosVuelta.first().textContent()) !== null && _7 !== void 0 ? _7 : "";
                        const horarioLlegadaVuelta = (_8 = await horariosVuelta.last().textContent()) !== null && _8 !== void 0 ? _8 : "";
                        vueloFinal.fechaSalidaVuelta = fechaSalidaVuelta;
                        vueloFinal.fechaLlegadaVuelta = fechaLlegadaVuelta;
                        vueloFinal.horarioSalidaVuelta = horarioSalidaVuelta;
                        vueloFinal.horarioLlegadaVuelta = horarioLlegadaVuelta;
                    }
                    else {
                        const fechaSalidaVuelta = (_9 = await fechasVuelta.first().textContent()) !== null && _9 !== void 0 ? _9 : "";
                        const fechaLlegadaVuelta = (_10 = await fechasVuelta.last().textContent()) !== null && _10 !== void 0 ? _10 : "";
                        const horarioSalidaVuelta = (_11 = await horariosVuelta.first().textContent()) !== null && _11 !== void 0 ? _11 : "";
                        const horarioLlegadaVuelta = (_12 = await horariosVuelta.last().textContent()) !== null && _12 !== void 0 ? _12 : "";
                        //si hay 1 escala, las fechas y horarios de la escala
                        const fechaLlegadaVueltaEscala = (_13 = await fechasVuelta.nth(1).textContent()) !== null && _13 !== void 0 ? _13 : "";
                        const fechaSalidaVueltaEscala = (_14 = await fechasVuelta.nth(2).textContent()) !== null && _14 !== void 0 ? _14 : "";
                        const horarioLlegadaVueltaEscala = (_15 = await horariosVuelta.nth(1).textContent()) !== null && _15 !== void 0 ? _15 : "";
                        const horarioSalidaVueltaEscala = (_16 = await horariosVuelta.nth(2).textContent()) !== null && _16 !== void 0 ? _16 : "";
                        vueloFinal.fechaSalidaVuelta = fechaSalidaVuelta;
                        vueloFinal.fechaLlegadaVuelta = fechaLlegadaVuelta;
                        vueloFinal.horarioSalidaVuelta = horarioSalidaVuelta;
                        vueloFinal.horarioLlegadaVuelta = horarioLlegadaVuelta;
                        vueloFinal.fechaSalidaVueltaEscala = fechaSalidaVueltaEscala;
                        vueloFinal.fechaLlegadaVueltaEscala = fechaLlegadaVueltaEscala;
                        vueloFinal.horarioLlegadaVueltaEscala = horarioLlegadaVueltaEscala;
                        vueloFinal.horarioSalidaVueltaEscala = horarioSalidaVueltaEscala;
                    }
                    // Si querés asignarlo:
                    //si hay 1 escala, las fechas y horarios de la escala
                }
                break;
            }
        }
        catch (error) {
            console.warn(`⚠️ Error en fila ${i}:`, error);
        }
    }
    return vueloFinal ? vueloFinal : 'No hay ningun vuelo disponible con estas opciones';
}
