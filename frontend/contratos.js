
(() => {
    const modulo = {
        async render() {
            const app = window.Siandra;
            const db = app.db;
            const contenido = app.contenido;

            contenido.innerHTML = `
                <div class="page-header mb-4">
                    <div>
                        <h1 class="page-title">Contratos</h1>
                        <p class="muted-text mb-0">
                            Administración de contratos inmobiliarios.
                        </p>
                    </div>
                </div>

                <div id="contratosMensaje"></div>

                <div class="admin-card p-4 mb-4">
                    <h2 class="section-heading">Registrar contrato</h2>

                    <form id="formContrato">
                        <div class="row g-3">
                            <div class="col-12 col-md-6">
                                <label class="form-label" for="contratoPropiedad">
                                    Propiedad *
                                </label>
                                <select class="form-select" id="contratoPropiedad"
                                    name="property_id" required>
                                    <option value="">Cargando propiedades...</option>
                                </select>
                            </div>

                            <div class="col-12 col-md-6">
                                <label class="form-label" for="contratoPersona">
                                    Persona vinculada *
                                </label>
                                <select class="form-select" id="contratoPersona"
                                    name="person_id" required>
                                    <option value="">Cargando personas...</option>
                                </select>
                            </div>

                            <div class="col-12 col-md-4">
                                <label class="form-label" for="contratoTipo">
                                    Tipo de contrato *
                                </label>
                                <select class="form-select" id="contratoTipo"
                                    name="contract_type" required>
                                    <option value="Alquiler">Alquiler</option>
                                    <option value="Venta">Venta</option>
                                </select>
                            </div>

                            <div class="col-12 col-md-4">
                                <label class="form-label" for="contratoInicio">
                                    Fecha de inicio *
                                </label>
                                <input class="form-control" type="date"
                                    id="contratoInicio" name="start_date" required>
                            </div>

                            <div class="col-12 col-md-4">
                                <label class="form-label" for="contratoFin">
                                    Fecha de finalización
                                </label>
                                <input class="form-control" type="date"
                                    id="contratoFin" name="end_date">
                            </div>

                            <div class="col-12 col-md-4">
                                <label class="form-label" for="contratoMonto">
                                    Monto del contrato *
                                </label>
                                <input class="form-control" type="number"
                                    id="contratoMonto" name="amount"
                                    min="0" step="0.01" required>
                            </div>

                            <div class="col-12 col-md-4">
                                <label class="form-label" for="contratoMoneda">
                                    Moneda *
                                </label>
                                <select class="form-select" id="contratoMoneda"
                                    name="currency" required>
                                    <option value="ARS">Pesos argentinos (ARS)</option>
                                    <option value="USD">Dólares (USD)</option>
                                </select>
                            </div>

                            <div class="col-12 col-md-4">
                                <label class="form-label" for="contratoDeposito">
                                    Depósito o seña
                                </label>
                                <input class="form-control" type="number"
                                    id="contratoDeposito" name="deposit"
                                    min="0" step="0.01" value="0" required>
                            </div>

                            <div class="col-12 col-md-4">
                                <label class="form-label" for="contratoDiaPago">
                                    Día de pago mensual
                                </label>
                                <input class="form-control" type="number"
                                    id="contratoDiaPago" name="payment_day"
                                    min="1" max="31" placeholder="Ej.: 10">
                            </div>

                            <div class="col-12 col-md-8">
                                <label class="form-label" for="contratoNotas">
                                    Observaciones
                                </label>
                                <textarea class="form-control" id="contratoNotas"
                                    name="notes" rows="2"
                                    placeholder="Detalles adicionales del contrato"></textarea>
                            </div>

                            <div class="col-12">
                                <button class="btn btn-gold" type="submit"
                                    id="guardarContrato">
                                    <i class="bi bi-plus-circle me-1"></i>
                                    Registrar contrato
                                </button>
                            </div>
                        </div>
                    </form>
                </div>

                <div class="admin-card p-4">
                    <div class="d-flex flex-wrap justify-content-between
                        align-items-center gap-2 mb-3">
                        <h2 class="section-heading mb-0">Contratos registrados</h2>
                        <button class="btn btn-outline-secondary btn-sm"
                            type="button" id="recargarContratos">
                            <i class="bi bi-arrow-clockwise me-1"></i>
                            Actualizar
                        </button>
                    </div>

                    <div id="listaContratos">
                        <p class="muted-text">Cargando contratos...</p>
                    </div>
                </div>
            `;

            const mensaje = (texto, tipo = 'success') => {
                const zona = document.getElementById('contratosMensaje');
                zona.innerHTML = `
                    <div class="alert alert-${tipo} alert-dismissible fade show"
                        role="alert">
                        ${app.escapar(texto)}
                        <button type="button" class="btn-close"
                            data-bs-dismiss="alert" aria-label="Cerrar"></button>
                    </div>
                `;
            };

            const cargarOpciones = async () => {
                const propiedadSelect =
                    document.getElementById('contratoPropiedad');
                const personaSelect =
                    document.getElementById('contratoPersona');

                const [resultadoPropiedades, resultadoPersonas] =
                    await Promise.all([
                        db.from('properties')
                            .select('id, property_code, title, address')
                            .is('archived_at', null)
                            .order('title'),
                        db.from('people')
                            .select('id, full_name, document_number')
                            .is('archived_at', null)
                            .order('full_name')
                    ]);

                if (resultadoPropiedades.error) {
                    propiedadSelect.innerHTML =
                        '<option value="">Error al cargar propiedades</option>';
                    console.error(resultadoPropiedades.error);
                } else {
                    const propiedades = resultadoPropiedades.data || [];
                    propiedadSelect.innerHTML =
                        '<option value="">Seleccioná una propiedad</option>' +
                        propiedades.map(p => {
                            const titulo = p.title || 'Sin título';
                            const codigo = p.property_code
                                ? ` (${p.property_code})` : '';
                            const direccion = p.address
                                ? ` — ${p.address}` : '';
                            return `<option value="${app.escapar(p.id)}">
                                ${app.escapar(titulo + codigo + direccion)}
                            </option>`;
                        }).join('');

                    if (propiedades.length === 0) {
                        propiedadSelect.innerHTML =
                            '<option value="">No hay propiedades disponibles</option>';
                    }
                }

                if (resultadoPersonas.error) {
                    personaSelect.innerHTML =
                        '<option value="">Error al cargar personas</option>';
                    console.error(resultadoPersonas.error);
                } else {
                    const personas = resultadoPersonas.data || [];
                    personaSelect.innerHTML =
                        '<option value="">Seleccioná una persona</option>' +
                        personas.map(p => {
                            const documento = p.document_number
                                ? ` — ${p.document_number}` : '';
                            return `<option value="${app.escapar(p.id)}">
                                ${app.escapar(p.full_name + documento)}
                            </option>`;
                        }).join('');

                    if (personas.length === 0) {
                        personaSelect.innerHTML =
                            '<option value="">No hay personas disponibles</option>';
                    }
                }
            };

            const cargarContratos = async () => {
                const lista = document.getElementById('listaContratos');
                lista.innerHTML =
                    '<p class="muted-text">Cargando contratos...</p>';

                const { data, error } = await db
                    .from('contracts')
                    .select(`
                        id,
                        contract_type,
                        start_date,
                        end_date,
                        amount,
                        currency,
                        deposit,
                        payment_day,
                        status,
                        notes,
                        properties (title, property_code),
                        people (full_name)
                    `)
                    .is('archived_at', null)
                    .order('created_at', { ascending: false });

                if (error) {
                    console.error('Error al cargar contratos:', error);
                    lista.innerHTML = `
                        <div class="alert alert-danger">
                            No se pudieron cargar los contratos.
                            Revisá la consola para ver el detalle.
                        </div>`;
                    return;
                }

                if (!data || data.length === 0) {
                    lista.innerHTML = `
                        <div class="text-center py-4">
                            <i class="bi bi-file-earmark-text fs-1 text-secondary"></i>
                            <p class="muted-text mt-2 mb-0">
                                Todavía no hay contratos registrados.
                            </p>
                        </div>`;
                    return;
                }

                const escapar = app.escapar;
                const fecha = valor => {
                    if (!valor) return 'Sin fecha';
                    const partes = valor.split('-');
                    return partes.length === 3
                        ? `${partes[2]}/${partes[1]}/${partes[0]}`
                        : escapar(valor);
                };

                const importe = (valor, moneda) =>
                    new Intl.NumberFormat('es-AR', {
                        style: 'currency',
                        currency: moneda || 'ARS'
                    }).format(Number(valor || 0));

                const estados = ['Borrador', 'Activo', 'Finalizado', 'Cancelado'];

                lista.innerHTML = `
                    <div class="table-responsive">
                        <table class="table table-hover align-middle">
                            <thead>
                                <tr>
                                    <th>Propiedad</th>
                                    <th>Persona</th>
                                    <th>Tipo</th>
                                    <th>Monto</th>
                                    <th>Vigencia</th>
                                    <th>Estado</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${data.map(c => {
                                    const propiedad =
                                        c.properties?.title || 'Propiedad no disponible';
                                    const codigo =
                                        c.properties?.property_code || '';
                                    const persona =
                                        c.people?.full_name || 'Persona no disponible';

                                    return `
                                        <tr>
                                            <td>
                                                <strong>${escapar(propiedad)}</strong>
                                                ${codigo ? `<div class="small text-secondary">${escapar(codigo)}</div>` : ''}
                                            </td>
                                            <td>${escapar(persona)}</td>
                                            <td>${escapar(c.contract_type)}</td>
                                            <td>
                                                <strong>${escapar(importe(c.amount, c.currency))}</strong>
                                                ${Number(c.deposit) > 0
                                                    ? `<div class="small text-secondary">Depósito: ${escapar(importe(c.deposit, c.currency))}</div>`
                                                    : ''}
                                            </td>
                                            <td>
                                                ${fecha(c.start_date)}
                                                <div class="small text-secondary">
                                                    Hasta: ${fecha(c.end_date)}
                                                </div>
                                            </td>
                                            <td>
                                                <select class="form-select form-select-sm estado-contrato"
                                                    data-id="${escapar(c.id)}"
                                                    aria-label="Estado del contrato">
                                                    ${estados.map(estado => `
                                                        <option value="${estado}"
                                                            ${c.status === estado ? 'selected' : ''}>
                                                            ${estado}
                                                        </option>
                                                    `).join('')}
                                                </select>
                                            </td>
                                        </tr>
                                        ${c.notes ? `
                                            <tr>
                                                <td colspan="6" class="small text-secondary pt-0">
                                                    <i class="bi bi-chat-left-text me-1"></i>
                                                    ${escapar(c.notes)}
                                                </td>
                                            </tr>` : ''}
                                    `;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>
                    <p class="small text-secondary mb-0">
                        Total de contratos: ${data.length}
                    </p>
                `;

                lista.querySelectorAll('.estado-contrato').forEach(select => {
                    select.addEventListener('change', async () => {
                        const estadoAnterior = data.find(
                            c => c.id === select.dataset.id
                        )?.status;

                        select.disabled = true;

                        const { error: errorActualizacion } = await db
                            .from('contracts')
                            .update({
                                status: select.value,
                                updated_by: app.usuario()?.id || null,
                                updated_at: new Date().toISOString()
                            })
                            .eq('id', select.dataset.id);

                        select.disabled = false;

                        if (errorActualizacion) {
                            console.error(
                                'Error al actualizar el contrato:',
                                errorActualizacion
                            );
                            mensaje('No se pudo actualizar el estado del contrato.',
                                'danger');
                            select.value = estadoAnterior || 'Activo';
                            return;
                        }

                        mensaje('Estado del contrato actualizado correctamente.');
                        await cargarContratos();
                    });
                });
            };

            document.getElementById('formContrato')
                .addEventListener('submit', async event => {
                    event.preventDefault();

                    const formulario = event.currentTarget;
                    const boton = document.getElementById('guardarContrato');
                    const campos = new FormData(formulario);

                    const fechaInicio = campos.get('start_date');
                    const fechaFin = campos.get('end_date');

                    if (fechaFin && fechaFin < fechaInicio) {
                        mensaje('La fecha de finalización no puede ser anterior al inicio.',
                            'warning');
                        return;
                    }

                    const monto = Number(campos.get('amount'));
                    const deposito = Number(campos.get('deposit') || 0);

                    if (!Number.isFinite(monto) || monto < 0 ||
                        !Number.isFinite(deposito) || deposito < 0) {
                        mensaje('Ingresá montos válidos, iguales o mayores a cero.',
                            'warning');
                        return;
                    }

                    const contrato = {
                        property_id: campos.get('property_id'),
                        person_id: campos.get('person_id'),
                        contract_type: campos.get('contract_type'),
                        start_date: fechaInicio,
                        end_date: fechaFin || null,
                        amount: monto,
                        currency: campos.get('currency'),
                        deposit: deposito,
                        payment_day: campos.get('payment_day')
                            ? Number(campos.get('payment_day')) : null,
                        status: 'Activo',
                        notes: String(campos.get('notes') || '').trim() || null,
                        created_by: app.usuario()?.id || null,
                        updated_by: app.usuario()?.id || null
                    };

                    boton.disabled = true;
                    boton.textContent = 'Guardando...';

                    const { error } = await db
                        .from('contracts')
                        .insert(contrato);

                    boton.disabled = false;
                    boton.innerHTML =
                        '<i class="bi bi-plus-circle me-1"></i> Registrar contrato';

                    if (error) {
                        console.error('Error al registrar el contrato:', error);
                        mensaje(
                            'No se pudo registrar el contrato. Verificá los datos e intentá nuevamente.',
                            'danger'
                        );
                        return;
                    }

                    mensaje('Contrato registrado correctamente.');
                    formulario.reset();

                    await cargarOpciones();
                    await cargarContratos();
                });

            document.getElementById('recargarContratos')
                .addEventListener('click', async () => {
                    await cargarOpciones();
                    await cargarContratos();
                });

            await cargarOpciones();
            await cargarContratos();
        }
    };

    window.SiandraModulos = window.SiandraModulos || {};
    window.SiandraModulos.contratos = modulo;
})();
