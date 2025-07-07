import { Page } from 'playwright';

export default async function recorroListaVuelos(page: Page) {
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
    }

    for (let i = 0; i < cantidadFilas; i++) {
        const fila = filasVisibles.nth(i);
        const contenedor = fila.locator('.baggage-cont');

        try {
            // const equipajeMano = contenedor.locator('.baggage.hand').first();
            const equipajeCarrion = contenedor.locator('.baggage.carry-on').first();
            const equipajeBodega = contenedor.locator('.baggage.dispatch').first();

            // const tieneMano = (await equipajeMano.getAttribute('class'))?.includes('included') ?? false;
            const tieneCarrion = (await equipajeCarrion.getAttribute('class'))?.includes('included') ?? false;
            const tieneBodega = (await equipajeBodega.getAttribute('class'))?.includes('included') ?? false;



            if (tieneCarrion || tieneBodega) {
                const strongLocator = fila.locator('strong.priceNumb')
                vueloFinal.precioFinal = (await strongLocator.textContent()) ?? "";
                vueloFinal.aeropuertoIda = (await fila.locator('//*[@id="showDetail"]/div[1]/div[2]/div[1]/div[1]/span[1]').textContent()) ?? "";
                // vueloFinal.horarioSalidaIda = (await fila.locator('//*[@id="showDetail"]/div[1]/div[2]/div[1]/div[1]/span[2]/strong').textContent()) ?? "";
                vueloFinal.ciudadOrigenIda = (await fila.locator('//*[@id="showDetail"]/div[1]/div[2]/div[1]/div[2]/span').textContent()) ?? "";
                vueloFinal.horarioSupongoDuracionIda = (await fila.locator('//*[@id="showDetail"]/div[1]/div[2]/div[2]/span[1]').textContent()) ?? "";
                vueloFinal.escalasIda = (await fila.locator('//*[@id="showDetail"]/div[1]/div[2]/div[2]/span[2]').textContent()) ?? "";
                // vueloFinal.horarioSupongoLlegadaIda = (await fila.locator('//*[@id="showDetail"]/div[1]/div[2]/div[3]/div[1]/span[1]/strong').textContent()) ?? "";



                const nodoCityLocator = fila.locator('//*[@id="showDetail"]/div[1]/div[2]/div[3]/div[1]/span[2]');
                const handle = await nodoCityLocator.elementHandle();
                const mad = await handle?.evaluate(el => el.childNodes[0]?.nodeValue?.trim() ?? "");
                vueloFinal.aeropuertoDestinoIda = mad ?? "";
                vueloFinal.ciudadDestinoIda = (await fila.locator('//*[@id="showDetail"]/div[1]/div[2]/div[3]/div[2]/span').textContent()) ?? "";

                vueloFinal.aeropuertoVuelta = (await fila.locator('//*[@id="showDetail"]/div[3]/div[2]/div[1]/div[1]/span[1]').textContent()) ?? "";
                vueloFinal.horarioSalidaVuelta = (await fila.locator('//*[@id="showDetail"]/div[3]/div[2]/div[1]/div[1]/span[2]').textContent()) ?? "";
                vueloFinal.ciudadOrigenVuelta = (await fila.locator('//*[@id="showDetail"]/div[3]/div[2]/div[1]/div[2]/span').textContent()) ?? "";
                vueloFinal.horarioSupongoDuracionVuelta = (await fila.locator('//*[@id="showDetail"]/div[3]/div[2]/div[2]/span[1]').textContent()) ?? "";
                vueloFinal.escalasVuelta = (await fila.locator('//*[@id="showDetail"]/div[3]/div[2]/div[2]/span[2]').textContent()) ?? "";
                // vueloFinal.horarioSupongoLlegadaVuelta = (await fila.locator('//*[@id="showDetail"]/div[3]/div[2]/div[3]/div[1]/span[1]/strong').textContent()) ?? "";
                // vueloFinal.aeropuertoDestinoVuelta = (await fila.locator('//*[@id="showDetail"]/div[3]/div[2]/div[3]/div[1]/span[2]').textContent()) ?? "";

                const nodoCityLocatorVuelta = fila.locator('//*[@id="showDetail"]/div[3]/div[2]/div[3]/div[1]/span[2]');
                const handleVuelta = await nodoCityLocatorVuelta.elementHandle();
                const madVuelta = await handleVuelta?.evaluate(el => el.childNodes[0]?.nodeValue?.trim() ?? "");
                vueloFinal.aeropuertoDestinoVuelta = madVuelta ?? "";

                vueloFinal.ciudadDestinoVuelta = (await fila.locator('//*[@id="showDetail"]/div[3]/div[2]/div[3]/div[2]/span').textContent()) ?? "";

                vueloFinal.aerolinea = (await fila.locator('//*[@id="showDetail"]/div[3]/div[1]/img').getAttribute('title')) ?? "";
                await fila.locator('text=Ver Detalle').click();

                // // Esperar que aparezca la info expandida
                await page.waitForTimeout(4000)

                const bloquesVuelo = await fila.locator('#flight-detail-information').all();
                if (bloquesVuelo.length >= 2) {
                    // 👉 Primer bloque: IDA
                    const ida = bloquesVuelo[0];
                    const fechasIda = ida.locator('p.leg-departure-date >> strong');
                    const horarios = ida.locator('strong.leg-departure-time >> span');
                    console.log("cantidad de strong ", await fechasIda.count())
                    if (await fechasIda.count() <= 2) {
                        const fechaSalidaIda = await fechasIda.first().textContent() ?? "";
                        const fechaLlegadaIda = await fechasIda.last().textContent() ?? "";
                        const horarioSalidaIda = await horarios.first().textContent() ?? "";
                        const horarioLlegadaIda = await horarios.last().textContent() ?? "";
                        vueloFinal.fechaSalidaIda = fechaSalidaIda;
                        vueloFinal.fechaLlegadaIda = fechaLlegadaIda;
                        vueloFinal.horarioSalidaIda = horarioSalidaIda;
                        vueloFinal.horarioLlegadaIda = horarioLlegadaIda;
                    } else {

                        const fechaSalidaIda = await fechasIda.first().textContent() ?? "";
                        const fechaLlegadaIda = await fechasIda.last().textContent() ?? "";
                        const horarioSalidaIda = await horarios.first().textContent() ?? "";
                        const horarioLlegadaIda = await horarios.last().textContent() ?? "";

                        //si hay 1 escala, las fechas y horarios de la escala
                        const fechaLlegadaIdaEscala = await fechasIda.nth(1).textContent() ?? "";
                        const fechaSalidaIdaEscala = await fechasIda.nth(2).textContent() ?? "";
                        const horarioLlegadaIdaEscala = await horarios.nth(1).textContent() ?? "";
                        const horarioSalidaIdaEscala = await horarios.nth(2).textContent() ?? "";

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
                        const fechaSalidaVuelta = await fechasVuelta.first().textContent() ?? "";
                        const fechaLlegadaVuelta = await fechasVuelta.last().textContent() ?? "";
                        const horarioSalidaVuelta = await horariosVuelta.first().textContent() ?? "";
                        const horarioLlegadaVuelta = await horariosVuelta.last().textContent() ?? "";


                        vueloFinal.fechaSalidaVuelta = fechaSalidaVuelta;
                        vueloFinal.fechaLlegadaVuelta = fechaLlegadaVuelta;
                        vueloFinal.horarioSalidaVuelta = horarioSalidaVuelta;
                        vueloFinal.horarioLlegadaVuelta = horarioLlegadaVuelta;

                    } else {
                        const fechaSalidaVuelta = await fechasVuelta.first().textContent() ?? "";
                        const fechaLlegadaVuelta = await fechasVuelta.last().textContent() ?? "";
                        const horarioSalidaVuelta = await horariosVuelta.first().textContent() ?? "";
                        const horarioLlegadaVuelta = await horariosVuelta.last().textContent() ?? "";

                        //si hay 1 escala, las fechas y horarios de la escala
                        const fechaLlegadaVueltaEscala = await fechasVuelta.nth(1).textContent() ?? "";
                        const fechaSalidaVueltaEscala = await fechasVuelta.nth(2).textContent() ?? "";
                        const horarioLlegadaVueltaEscala = await horariosVuelta.nth(1).textContent() ?? "";
                        const horarioSalidaVueltaEscala = await horariosVuelta.nth(2).textContent() ?? "";


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
        } catch (error) {
            console.warn(`⚠️ Error en fila ${i}:`, error);
        }
    }





    return vueloFinal ? vueloFinal : 'No hay ningun vuelo disponible con estas opciones';
}
