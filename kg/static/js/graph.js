// graph.js - D3.js Implementation for SPKG Knowledge Graph

const svg = d3.select("#graph-container");

function getGraphWidth() {
    const panels = ['property-inspector', 'chat-panel'];
    let w = window.innerWidth - 64;
    panels.forEach(id => {
        const el = document.getElementById(id);
        if (el && !el.classList.contains('hidden')) {
            w -= (el.offsetWidth || (id === 'chat-panel' ? 384 : 320));
        }
    });
    return Math.max(w, 600);
}

const height = window.innerHeight;
const width = getGraphWidth();

svg.attr("width", width).attr("height", height);

const g = svg.append("g");

const urlParamsGlobal = new URLSearchParams(window.location.search);
const isMasterGraph = (urlParamsGlobal.get('drug') || 'All') === 'All';

// Apply uniform dense clustering for ALL Views, not just master
// Restore previous dense clustering and aesthetics
const linkDist = 90;
const chargeStr = -300;
const collideRad = 45;
const gravity = 0.08;

// Force simulation
const simulation = d3.forceSimulation()
    .force("link", d3.forceLink().id(d => d.id).distance(linkDist))
    .force("charge", d3.forceManyBody().strength(chargeStr))
    .force("center", d3.forceCenter(width / 2, height / 2))
    .force("x", d3.forceX(width / 2).strength(gravity))
    .force("y", d3.forceY(height / 2).strength(gravity))
    .force("collision", d3.forceCollide().radius(collideRad));
// Zoom handler
const zoom = d3.zoom()
    .scaleExtent([0.1, 8])
    .on("zoom", (event) => {
        g.attr("transform", event.transform);
    });

svg.call(zoom);

// Apply a default zoom out uniformly for all views so everything is compactly visible
svg.call(zoom.transform, d3.zoomIdentity.translate(width/2, height/2).scale(0.45).translate(-width/2, -height/2));

async function loadGraph() {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const drugParam = urlParams.get('drug') || 'All';
        
        const response = await fetch(`/api/graph?drug=${encodeURIComponent(drugParam)}`);
        const data = await response.json();
        if (data.error) return console.error("Spanner Error:", data.error);
        
        // Ensure nodes have initial coordinates to prevent overlapping in corners
        data.nodes.forEach(n => {
            n.x = width / 2 + (Math.random() - 0.5) * 200;
            n.y = height / 2 + (Math.random() - 0.5) * 200;
        });

        renderGraph(data);
    } catch (err) {
        console.error("Failed to load graph:", err);
    }
}

function normalizeType(type) {
    if (!type) return 'Default';
    const t = type.toLowerCase();
    if (t.includes('drug') || t.includes('compound')) return 'Drug';
    if (t.includes('gene') || t.includes('target')) return 'Gene';
    if (t.includes('path')) return 'Pathway';
    if (t.includes('spec') || t.includes('preclinical')) return 'Species';
    if (t.includes('adverse') || t.includes('event') || t.includes('side')) return 'AdverseEvent';
    if (t.includes('endpoint')) return 'Endpoint';
    return 'Default'; // Default if none matched
}

function renderGraph(data) {
    const defs = svg.append("defs");
    
    // Drop shadow
    const sf = defs.append("filter").attr("id", "drop-shadow").attr("height", "200%").attr("width", "200%");
    sf.append("feDropShadow").attr("dx", "2").attr("dy", "4").attr("stdDeviation", "2").attr("flood-opacity", "0.2");
    
    const hf = defs.append("filter").attr("id", "heavy-shadow").attr("height", "300%").attr("width", "300%");
    hf.append("feDropShadow").attr("dx", "4").attr("dy", "8").attr("stdDeviation", "6").attr("flood-opacity", "0.3");

    const colorMap = {
        'Drug': '#3b82f6',        // Hexagon: Blue
        'Gene': '#14b8a6',        // Diamond: Teal
        'Pathway': '#a855f7',     // Square: Purple
        'Species': '#22c55e',     // Triangle: Green
        'AdverseEvent': '#ef4444',// Reverse Triangle: Red
        'Endpoint': '#f59e0b',    // Circle: Orange
        'Default': '#94a3b8'
    };

    defs.append("style").text(`
        .node-path { transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.4s; filter: url(#drop-shadow); cursor: pointer; transform-box: fill-box; transform-origin: center; stroke: #fff; stroke-width: 2px; }
        .node-container:hover .node-path { stroke-width: 4px; filter: url(#heavy-shadow); }
        
        /* Focus/Highlight Classes */
        .node-container.focus-node .node-path { transform: scale(1.8) !important; stroke: #3b82f6 !important; stroke-width: 4px !important; opacity: 1 !important; visibility: visible !important; }
        .node-container.neighbor-node .node-path { transform: scale(1.3) !important; opacity: 1 !important; visibility: visible !important; }
        .node-container.dimmed .node-path { opacity: 0.08 !important; pointer-events: none; }
        .node-container.dimmed-drug .node-path { opacity: 0.15 !important; transform: scale(0.7) !important; }
        
        /* Label logic for focus */
        .hover-label-group { transition: opacity 0.3s; opacity: 0; pointer-events: none; }
        .node-container:hover .hover-label-group, 
        .neighbor-node .hover-label-group, 
        .focus-node .hover-label-group { opacity: 1; }
        
        .label-bg { fill: white; fill-opacity: 0.95; rx: 6; ry: 6; stroke: #cbd5e1; stroke-width: 1; }
        
        /* Links logic */
        .link { stroke: #3b82f6; stroke-width: 2.5px; pointer-events: none; transition: opacity 0.4s, stroke 0.4s; stroke-opacity: 0.6; }
        .link.dimmed { opacity: 0.05 !important; }
        .link.highlighted { stroke-opacity: 1 !important; stroke-width: 4px !important; stroke: #2563eb !important; }
        
        /* Link labels visibility */
        .link-labels g { transition: opacity 0.4s; }
        .link-labels.dimmed-all g { opacity: 0.05; }
        .link-labels.dimmed-all .highlighted-label { opacity: 1 !important; }
        
        .edge-label-bg { fill: white; fill-opacity: 0.95; rx: 4; ry: 4; stroke: #bfdbfe; stroke-width: 1; }
        .edge-label-text { font-family: 'Inter', sans-serif; font-size: 10px; font-weight: 800; fill: #1e3a8a; text-transform: lowercase; letter-spacing: 0.02em; }
    `);

    defs.append("marker").attr("id", "end").attr("viewBox", "0 -5 10 10").attr("refX", 32).attr("refY", 0).attr("markerWidth", 6).attr("markerHeight", 6).attr("orient", "auto")
        .append("path").attr("d", "M0,-5L10,0L0,5").attr("fill", "#2563eb"); 

    const link = g.append("g").attr("class", "links").selectAll("line").data(data.links).enter().append("line").attr("class", "link")
        .attr("stroke-dasharray", d => d.label === 'SimilarTo' ? "8,4" : "none")
        .attr("marker-end", "url(#end)");

    const linkLabelGroupParent = g.append("g").attr("class", "link-labels");
    const linkLabelGroup = linkLabelGroupParent.selectAll("g").data(data.links).enter().append("g");
    
    linkLabelGroup.append("rect").attr("class", "edge-label-bg").attr("height", 16).attr("y", -8);
    const linkText = linkLabelGroup.append("text").attr("class", "edge-label-text").attr("text-anchor", "middle").attr("dy", 3.5).text(d => d.label);

    linkText.each(function(d) {
        const bbox = this.getBBox();
        d3.select(this.parentNode).select("rect").attr("width", bbox.width + 12).attr("x", bbox.x - 6);
    });

    const hexagonPath = (size) => {
        const s = Math.sqrt(size) * 0.5;
        return `M0,${-s} L${s*0.866},${-s*0.5} L${s*0.866},${s*0.5} L0,${s} L${-s*0.866},${s*0.5} L${-s*0.866},${-s*0.5} Z`;
    };

    // Main containers that move with data coordinates
    const nodeContainer = g.append("g").attr("class", "node-containers").selectAll("g").data(data.nodes).enter()
        .append("g").attr("class", "node-container")
        .call(d3.drag().on("start", dragstarted).on("drag", dragged).on("end", dragended));

    // The actual Shape
    nodeContainer.append("path")
        .attr("class", "node-path")
        .attr("d", d => {
            const nt = normalizeType(d.type);
            const sf = 0.4; // 60% smaller uniformly across all views
            if (nt === 'Drug') return hexagonPath(4000 * sf); // Massive for primary drug
            if (nt === 'Gene') return d3.symbol().type(d3.symbolDiamond).size(1800 * sf)();
            if (nt === 'Pathway') return d3.symbol().type(d3.symbolSquare).size(1800 * sf)();
            if (nt === 'Species') return d3.symbol().type(d3.symbolTriangle).size(1600 * sf)();
            if (nt === 'AdverseEvent') return d3.symbol().type(d3.symbolTriangle).size(1600 * sf)(); 
            if (nt === 'Endpoint') return d3.symbol().type(d3.symbolCircle).size(1600 * sf)();
            return d3.symbol().type(d3.symbolCircle).size(1000 * sf)();
        })
        .attr("fill", d => colorMap[normalizeType(d.type)])
        .attr("transform", d => normalizeType(d.type) === 'AdverseEvent' ? 'rotate(180)' : '');

    // Hover Labels Only
    const labelGroup = nodeContainer.append("g").attr("class", "hover-label-group");
    labelGroup.append("rect").attr("class", "label-bg").attr("height", 20).attr("y", -10);
    const labelText = labelGroup.append("text").text(d => d.label).attr("font-size", "12px").attr("font-weight", "800").attr("fill", "#0f172a").attr("dx", 35).attr("dy", 4);

    labelText.each(function(d) {
        const bbox = this.getBBox();
        d3.select(this.parentNode).select("rect").attr("width", bbox.width + 16).attr("x", bbox.x - 8);
    });

    svg.on("click", (event) => {
        if (event.target.tagName === 'svg') resetView();
    });

    function resetView() {
        nodeContainer.attr("class", "node-container");
        link.classed("dimmed", false).classed("highlighted", false);
        linkLabelGroupParent.classed("dimmed-all", false);
        linkLabelGroup.classed("highlighted-label", false);
        
        const cw = getGraphWidth();
        svg.transition().duration(800).call(zoom.transform, d3.zoomIdentity.translate(cw/2, height/2).scale(1).translate(-cw/2, -height/2));
    }

    nodeContainer.on("click", (event, d) => {
        event.stopPropagation();
        
        const header = document.getElementById("main-header-title");
        if (header) header.textContent = `${d.label} Analysis`;

        const inspector = document.getElementById("property-inspector");
        inspector.classList.remove("hidden");
        
        setTimeout(() => {
            const cw = getGraphWidth();
            const ch = window.innerHeight;
            
            // neighborNodes logic: Self + neighbors via links
            const neighborIds = new Set();
            neighborIds.add(d.id);
            
            data.links.forEach(l => {
                const sid = typeof l.source === 'object' ? l.source.id : l.source;
                const tid = typeof l.target === 'object' ? l.target.id : l.target;
                if (sid === d.id) neighborIds.add(tid);
                if (tid === d.id) neighborIds.add(sid);
            });

            const neighborNodes = data.nodes.filter(n => neighborIds.has(n.id));

            nodeContainer.attr("class", n => {
                let cls = "node-container ";
                if (n.id === d.id) cls += "focus-node";
                else if (neighborIds.has(n.id)) cls += "neighbor-node";
                else cls += (normalizeType(n.type) === 'Drug' ? "dimmed-drug" : "dimmed");
                return cls;
            });

            link.classed("highlighted", l => {
                const sid = typeof l.source === 'object' ? l.source.id : l.source;
                const tid = typeof l.target === 'object' ? l.target.id : l.target;
                return (sid === d.id || tid === d.id);
            }).classed("dimmed", l => {
                const sid = typeof l.source === 'object' ? l.source.id : l.source;
                const tid = typeof l.target === 'object' ? l.target.id : l.target;
                return (sid !== d.id && tid !== d.id);
            });

            linkLabelGroupParent.classed("dimmed-all", true);
            linkLabelGroup.classed("highlighted-label", l => {
                const sid = typeof l.source === 'object' ? l.source.id : l.source;
                const tid = typeof l.target === 'object' ? l.target.id : l.target;
                return (sid === d.id || tid === d.id);
            });
            
            nodeContainer.filter(n => neighborIds.has(n.id)).raise();

            const xRange = d3.extent(neighborNodes, n => n.x), yRange = d3.extent(neighborNodes, n => n.y);
            const pad = 280;
            const scale = Math.min(cw / (xRange[1]-xRange[0]+pad), ch / (yRange[1]-yRange[0]+pad), 3);
            
            svg.transition().duration(1000).ease(d3.easeCubicInOut).call(zoom.transform, d3.zoomIdentity
                .translate(cw/2, ch/2).scale(scale).translate(-(xRange[0]+xRange[1])/2, -(yRange[0]+yRange[1])/2));

            const content = document.getElementById("property-content") || document.getElementById("node-details");
            let propsHtml = ``;


            propsHtml += `<div class="mb-8"><span class="text-[9px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-1 block">Entity Classification</span><span class="text-2xl font-black hcl-blue tracking-tight block">${d.label}</span><div class="inline-block px-2 py-1 bg-blue-50 text-[10px] font-bold hcl-blue rounded mt-2 border border-blue-100">${d.type} Node</div></div><div class="space-y-6">`;

            // PubChem dynamic Injection for Drugs
            if (normalizeType(d.type) === 'Drug') {
                propsHtml += `<div id="pubchem-loader" class="text-xs text-blue-500 font-bold mb-4 bg-blue-50 p-3 rounded text-center animate-pulse">Fetching live chemical data from PubChem API...</div>`;
                
                async function robustFetchPubChem(name) {
                    const simpleClean = name.replace(/ (HBR|HCL|SULFATE|SODIUM|POTASSIUM|MALEATE|FUMARATE|MESYLATE)$/i, '');
                    const propsUrl = (term, type='name') => `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/${type}/${encodeURIComponent(term)}/property/IUPACName,MolecularFormula,MolecularWeight,XLogP,HBondDonorCount,HBondAcceptorCount,CanonicalSMILES,IsomericSMILES,Complexity,TPSA,RotatableBondCount,HeavyAtomCount/JSON`;
                    
                    try {
                        // 1. Direct Name
                        let res = await fetch(propsUrl(name));
                        if (res.ok) return await res.json();
                        
                        // 2. Simple Salt Clean
                        if (simpleClean !== name) {
                            res = await fetch(propsUrl(simpleClean));
                            if (res.ok) return await res.json();
                        }
                        
                        // 3. Synonym Resolve
                        const synRes = await fetch(`https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(name)}/synonyms/JSON`);
                        if (synRes.ok) {
                            const synData = await synRes.json();
                            const cid = (synData.InformationList.Information[0].CID || [])[0];
                            if (cid) {
                                res = await fetch(propsUrl(cid, 'cid'));
                                if (res.ok) return await res.json();
                            }
                        }

                        // 4. Fallback to NCI/CADD Cactus for SMILES only
                        try {
                            const cacRes = await fetch(`https://cactus.nci.nih.gov/chemical/structure/${encodeURIComponent(name)}/smiles`);
                            if (cacRes.ok) {
                                const s = await cacRes.text();
                                if (s && s.length > 2) {
                                    return { PropertyTable: { Properties: [{ CanonicalSMILES: s, IUPACName: name, CID: 'NCI' }] } };
                                }
                            }
                        } catch(e) {}
                    } catch (e) {}
                    return null;
                }

                robustFetchPubChem(d.label).then(pcData => {
                    if (!pcData) throw new Error("Not found");
                    const props = pcData.PropertyTable.Properties[0];
                    console.log("PubChem Metadata extracted for:", d.label, props);

                    const imgUrl = props.CID ? `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${props.CID}/PNG` : '';
                    
                    // Multi-key Case-Insensitive SMILES probing
                    const smiles = props.CanonicalSMILES || props.IsomericSMILES || props.CanonicalSmiles || props.IsomericSmiles || props.SMILES || props.Smiles || 'N/A';
                    
                    let pcHtml = `
                        <div class="mb-4 bg-gray-50 rounded-xl p-3 border border-gray-200 shadow-sm text-center relative">
                            <div class="absolute top-2 right-2 text-[8px] font-bold text-gray-400 bg-gray-200 px-1 rounded uppercase tracking-widest">PUBCHEM LIVE</div>
                            ${imgUrl ? `<img src="${imgUrl}" alt="2D Structure" class="mx-auto h-32 object-contain mix-blend-multiply" onerror="this.style.display='none'">` : '<div class="h-32 flex items-center justify-center text-gray-300 text-[10px] font-bold uppercase tracking-widest">No Structure</div>'}
                        </div>
                        <div class="group"><div class="flex justify-between items-end mb-1"><span class="text-[10px] font-bold text-blue-600 uppercase tracking-widest">PUBCHEM CID</span><span class="text-sm font-black text-slate-800">${props.CID || 'N/A'}</span></div></div>
                        <div class="group"><div class="flex justify-between items-end mb-1"><span class="text-[10px] font-bold text-blue-600 uppercase tracking-widest">IUPAC NAME</span></div><p class="text-[10px] font-bold text-slate-800 break-words mb-4 leading-tight">${props.IUPACName || 'N/A'}</p></div>
                        
                        <div class="bg-blue-900 text-white p-3 rounded-xl shadow-lg border border-blue-800 mb-6 mt-2">
                            <div class="text-[8px] uppercase font-black text-blue-300 mb-1 tracking-widest">SMILES Notation</div>
                            <div class="text-[10px] font-mono break-all font-bold opacity-90">${smiles}</div>
                        </div>
                        <div class="grid grid-cols-2 gap-3 mb-6">
                            <div class="bg-blue-50 p-2.5 rounded-lg border border-blue-100 shadow-sm"><div class="text-[9px] uppercase font-bold text-blue-400 mb-0.5">Formula</div><div class="text-xs font-black text-blue-900">${props.MolecularFormula || 'N/A'}</div></div>
                            <div class="bg-blue-50 p-2.5 rounded-lg border border-blue-100 shadow-sm"><div class="text-[9px] uppercase font-bold text-blue-400 mb-0.5">Weight</div><div class="text-xs font-black text-blue-900">${props.MolecularWeight || 'N/A'} g/mol</div></div>
                            
                            <div class="bg-gray-50 p-2.5 rounded-lg border border-gray-200 shadow-sm"><div class="text-[9px] uppercase font-bold text-gray-500 mb-0.5">LogP</div><div class="text-xs font-black text-gray-800">${props.XLogP !== undefined ? props.XLogP : 'N/A'}</div></div>
                            <div class="bg-gray-50 p-2.5 rounded-lg border border-gray-200 shadow-sm"><div class="text-[9px] uppercase font-bold text-gray-500 mb-0.5">TPSA</div><div class="text-xs font-black text-gray-800">${props.TPSA || 'N/A'} Å² </div></div>

                            <div class="bg-gray-50 p-2.5 rounded-lg border border-gray-200 shadow-sm"><div class="text-[9px] uppercase font-bold text-gray-500 mb-0.5">H-Donor/Acceptor</div><div class="text-xs font-black text-gray-800">${props.HBondDonorCount || 0} / ${props.HBondAcceptorCount || 0}</div></div>
                            <div class="bg-gray-50 p-2.5 rounded-lg border border-gray-200 shadow-sm"><div class="text-[9px] uppercase font-bold text-gray-500 mb-0.5">Rotatable Bonds</div><div class="text-xs font-black text-gray-800">${props.RotatableBondCount || 0}</div></div>
                            
                            <div class="bg-rose-50 p-2.5 rounded-lg border border-rose-100 shadow-sm"><div class="text-[9px] uppercase font-bold text-rose-400 mb-0.5">Complexity</div><div class="text-xs font-black text-rose-900">${props.Complexity || 'N/A'}</div></div>
                            <div class="bg-rose-50 p-2.5 rounded-lg border border-rose-100 shadow-sm"><div class="text-[9px] uppercase font-bold text-rose-400 mb-0.5">Heavy Atoms</div><div class="text-xs font-black text-rose-900">${props.HeavyAtomCount || 'N/A'}</div></div>
                        </div>
                        <hr class="my-5 border-gray-200">
                    `;
                    const loader = document.getElementById('pubchem-loader');
                    if (loader) loader.outerHTML = pcHtml;

                    // Enable dynamic navigation footer
                    const footer = document.getElementById('inspector-footer');
                    if (footer) {
                        footer.classList.remove('hidden');
                        document.getElementById('btn-inspect-compare').href = `/compare?mode=compare&drugs=${encodeURIComponent(d.label)}`;
                        document.getElementById('btn-inspect-predict').href = `/compare?mode=predict&drugs=${encodeURIComponent(d.label)}`;
                    } 
                }).catch(err => {
                    const loader = document.getElementById('pubchem-loader');
                    if (loader) loader.style.display = 'none';
                });
            }

            if (d.properties) {
                for (const [key, valObj] of Object.entries(d.properties)) {
                    propsHtml += `<div class="group"><div class="flex justify-between items-end mb-1"><span class="text-[10px] font-bold text-gray-500 uppercase tracking-widest">${key.replace(/_/g, ' ')}</span><span class="text-sm font-black text-slate-800">${valObj.value}</span></div><p class="text-[11px] text-gray-400 leading-relaxed font-medium pl-3 border-l-2 border-gray-100 group-hover:border-blue-200 transition-colors">${valObj.details}</p></div>`;
                }
            } else {
                propsHtml += `<p class="text-xs text-gray-400 italic py-10 text-center">No additional metadata available.</p>`;
            }

            // Cart button moved to top

            propsHtml += `</div>`;
            content.innerHTML = propsHtml;
        }, 350);
    });

    simulation.nodes(data.nodes).on("tick", () => {
        link.attr("x1", d => d.source.x).attr("y1", d => d.source.y).attr("x2", d => d.target.x).attr("y2", d => d.target.y);
        linkLabelGroup.attr("transform", d => `translate(${(d.source.x + d.target.x) / 2}, ${(d.source.y + d.target.y) / 2})`);
        
        // Only move the containers
        nodeContainer.attr("transform", d => `translate(${d.x},${d.y})`);
    });

    simulation.force("link").links(data.links);
    simulation.alpha(1).restart();

    // Removed the automatic 7-second UI panel closer to hand control back to manual toggle buttons

    // Stop Jitter
    setTimeout(() => {
        data.nodes.forEach(n => { n.fx = n.x; n.fy = n.y; });
        simulation.alpha(0).stop();
    }, 3000);
}

function dragstarted(event) { if (!event.active) simulation.alphaTarget(0.3).restart(); }
function dragged(event) { event.subject.fx = event.x; event.subject.fy = event.y; }
function dragended(event) { if (!event.active) simulation.alphaTarget(0); }

window.addEventListener('resize', () => {
    const w = getGraphWidth();
    svg.attr("width", w);
    simulation.force("center", d3.forceCenter(w / 2, height / 2));
});
loadGraph();
