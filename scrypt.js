// Construye la galería con recursos 2..11 en el orden numérico
;(function(){
	const gallery = document.getElementById('gallery')
	if(!gallery) return
	const items = []

	// Construimos la galería para los recursos 2..11 (puedes ajustar rango)
	for(let i=2;i<=11;i++){
		const card = document.createElement('figure')
		card.className = 'card'
		card.tabIndex = 0 // para accesibilidad y foco

		const img = document.createElement('img')
		img.className = 'thumb'
		img.alt = `Recurso ${i}`
		img.loading = 'lazy'
		img.decoding = 'async'

		// Lista de candidatos por prioridad
		const candidates = [
			`Recurso ${i}@2x.webp`,
			`Recurso ${i}.webp`,
			`Recurso ${i}.svg`,
			`recursos ${i}.svg`,
			`recurso ${i}.svg`
		]

		// función de asignación en cadena
		let idx = 0
		img.src = candidates[idx]
		img.addEventListener('error', function tryNext(){
			idx++
			if(idx < candidates.length){
				this.src = candidates[idx]
			}else{
				this.removeEventListener('error', tryNext)
				// si ninguna funciona, se muestra un placeholder ligero
				this.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="360"><rect width="100%" height="100%" fill="%23eee"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%23777" font-size="20">Imagen no disponible</text></svg>'
			}
		})

		const caption = document.createElement('figcaption')
		caption.className = 'caption'
		caption.textContent = `Recurso ${i}`

		card.appendChild(img)
		card.appendChild(caption)
		gallery.appendChild(card)

		// registramos item para lightbox
		items.push({imgEl: img, srcCandidates: candidates, caption: caption.textContent})
	}

	// teclado: Enter abre lightbox
	gallery.addEventListener('keydown', (e)=>{
		if(e.key === 'Enter'){
			const focused = document.activeElement
			if(focused && focused.tagName.toLowerCase() === 'figure'){
				const img = focused.querySelector('img')
				if(img) openLightboxBySrc(img.src)
			}
		}
	})

	// ---------- Lightbox implementation ----------
	const lb = document.getElementById('lightbox')
	const lbImage = document.getElementById('lb-image')
	const lbCaption = document.getElementById('lb-caption')
	const lbClose = document.querySelector('.lb-close')
	const lbPrev = document.querySelector('.lb-prev')
	const lbNext = document.querySelector('.lb-next')

	let currentIndex = -1

	function openLightbox(index){
		const item = items[index]
		if(!item) return
		// choose first loaded candidate (img.src already points to loaded one or placeholder)
		lbImage.src = item.imgEl.src
		lbImage.alt = item.caption || `Recurso ${index+2}`
		lbCaption.textContent = item.caption || ''
		currentIndex = index
		lb.setAttribute('aria-hidden','false')
		document.body.style.overflow = 'hidden'
	}

	function openLightboxBySrc(src){
		const idx = items.findIndex(it => it.imgEl.src === src)
		if(idx >= 0) openLightbox(idx)
	}

	function closeLightbox(){
		lb.setAttribute('aria-hidden','true')
		document.body.style.overflow = ''
		currentIndex = -1
	}

	function showNext(dir=1){
		if(items.length === 0) return
		currentIndex = (currentIndex + dir + items.length) % items.length
		openLightbox(currentIndex)
	}

	// abrir al hacer click en miniatura
	items.forEach((it, idx)=>{
			it.imgEl.addEventListener('click', ()=> openLightbox(idx))
			// accesible: doble acción con Enter ya manejada, y tecla Space
			it.imgEl.addEventListener('keydown', (e)=>{
				if(e.key === ' ' || e.key === 'Spacebar'){ // space
					e.preventDefault()
					openLightbox(idx)
				}
			})
	})

	// lightbox controls
	lbClose.addEventListener('click', closeLightbox)
	lbPrev.addEventListener('click', ()=> showNext(-1))
	lbNext.addEventListener('click', ()=> showNext(1))

	// cerrar con fondo click
	lb.addEventListener('click', (e)=>{
		if(e.target === lb) closeLightbox()
	})

	// teclado global para lightbox
	document.addEventListener('keydown', (e)=>{
		if(lb.getAttribute('aria-hidden') === 'false'){
			if(e.key === 'Escape') closeLightbox()
			if(e.key === 'ArrowRight') showNext(1)
			if(e.key === 'ArrowLeft') showNext(-1)
		}
	})

		// --- soporte táctil simple: swipe left/right para next/prev ---
		let touchStartX = 0
		let touchEndX = 0
		lb.addEventListener('touchstart', (e)=>{
			if(e.touches && e.touches.length === 1){
				touchStartX = e.touches[0].clientX
			}
		}, {passive:true})

		lb.addEventListener('touchmove', (e)=>{
			if(e.touches && e.touches.length === 1){
				touchEndX = e.touches[0].clientX
			}
		}, {passive:true})

		lb.addEventListener('touchend', ()=>{
			const delta = touchEndX - touchStartX
			if(Math.abs(delta) > 40){
				if(delta < 0) showNext(1)
				else showNext(-1)
			}
			touchStartX = 0; touchEndX = 0
		})
})()

// --- Añadimos lógica para el botón Compartir y la cotización (WhatsApp) ---
;(function(){
	function onReady(fn){
		if(document.readyState !== 'loading') fn()
		else document.addEventListener('DOMContentLoaded', fn)
	}

	onReady(()=>{
		const shareBtn = document.getElementById('shareBtn')
		const cotizaBtn = document.getElementById('cotizaBtn')

		if(shareBtn){
			shareBtn.addEventListener('click', async ()=>{
				const shareData = {
					title: document.title || 'Presentación',
					text: 'Revisa esta presentación de gestión de redes sociales',
					url: window.location.href
				}

				if(navigator.share){
					try{
						await navigator.share(shareData)
					}catch(err){
						// usuario canceló o fallo
						console.debug('Share cancelled or failed', err)
					}
				}else{
					// fallback: copiar enlace al portapapeles
					try{
						await navigator.clipboard.writeText(window.location.href)
						showToast('Enlace copiado al portapapeles')
					}catch(err){
						// último recurso: prompt
						window.prompt('Copia este enlace:', window.location.href)
					}
				}
			})
		}

		// cotizaBtn es un <a> con href directo a WhatsApp; en móviles abrirá la app si está instalada
		if(cotizaBtn){
			cotizaBtn.addEventListener('click', ()=>{
				// podemos registrar evento de analytics aquí si se necesita
			})
		}
	})

	// toast simple
	function showToast(text, ms=1800){
		let t = document.querySelector('.toast')
		if(!t){
			t = document.createElement('div')
			t.className = 'toast'
			document.body.appendChild(t)
		}
		t.textContent = text
		t.classList.add('show')
		clearTimeout(t._hideTimer)
		t._hideTimer = setTimeout(()=>t.classList.remove('show'), ms)
	}
})()
