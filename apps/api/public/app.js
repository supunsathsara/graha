document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('birthForm');
  const computeBtn = document.getElementById('computeBtn');
  const btnText = computeBtn.querySelector('.btn-text');
  const btnSpinner = computeBtn.querySelector('.btn-spinner');
  const resultsCard = document.getElementById('resultsCard');
  const errorCard = document.getElementById('errorCard');
  const errorMessage = document.getElementById('errorMessage');
  const rawResponse = document.getElementById('rawResponse');
  const aiBadge = document.getElementById('aiBadge');

  // ─── Preset locations ─────────────────────────────────
  document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.getElementById('latitude').value = btn.dataset.lat;
      document.getElementById('longitude').value = btn.dataset.lon;
    });
  });

  // ─── Tabs ─────────────────────────────────────────────
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(`tab-${tab.dataset.tab}`).classList.add('active');
    });
  });

  // ─── Form submit ──────────────────────────────────────
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    resultsCard.style.display = 'none';
    errorCard.style.display = 'none';

    const name = document.getElementById('name').value.trim();
    const birthDate = document.getElementById('birthDate').value;
    const birthTime = document.getElementById('birthTime').value;
    const latitude = parseFloat(document.getElementById('latitude').value);
    const longitude = parseFloat(document.getElementById('longitude').value);
    const timezone = document.getElementById('timezone').value;

    if (!birthDate || !birthTime || isNaN(latitude) || isNaN(longitude)) {
      showError('Please fill in all required fields.');
      return;
    }

    // Loading state
    setLoading(true);

    try {
      const body = { birthDate, birthTime, latitude, longitude, timezone };
      if (name) body.name = name;

      const res = await fetch('/api/prediction/interpret', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...body, aiMode: 'polish' }),
      });

      const data = await res.json();
      rawResponse.textContent = JSON.stringify(data, null, 2);

      if (!data.success) {
        showError(data.error || 'Something went wrong.');
        setLoading(false);
        return;
      }

      // Display results
      renderResults(data, name);
      resultsCard.style.display = 'block';
      resultsCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (err) {
      showError(err.message || 'Network error. Is the server running?');
    } finally {
      setLoading(false);
    }
  });

  // ─── Render ───────────────────────────────────────────
  function renderResults(data, name) {
    const r = data.reading;
    const chart = data.chart;

    // AI badge
    aiBadge.textContent = data.ai ? '✨ AI-Polished' : '📜 Rule-Based';
    aiBadge.style.display = 'inline-block';

    // ── Overview ──
    const overview = document.getElementById('overviewContent');
    const personName = name || chart?.name || 'Unknown';
    const lagnaSign = chart?.lagna?.sign !== undefined ? getSignName(chart.lagna.sign) : '—';
    const lagnaDeg = chart?.lagna?.degree?.toFixed(2) || '—';

    overview.innerHTML = `
      <div class="section-block">
        <div class="section-label">Chart for ${personName}</div>
        <div class="two-col" style="margin-bottom:12px">
          <div><strong>Birth:</strong> ${chart?.birthDate || '—'} at ${chart?.birthTime || '—'}</div>
          <div><strong>Location:</strong> ${chart?.latitude?.toFixed(4) || '—'}°N, ${chart?.longitude?.toFixed(4) || '—'}°E</div>
        </div>
      </div>
      <div class="section-block">
        <div class="section-label">Ascendant (Lagna)</div>
        <div class="section-text"><strong>${lagnaSign}</strong> at ${lagnaDeg}°</div>
      </div>
      <div class="section-block">
        <div class="section-label">General Reading</div>
        <div class="section-text">${escapeHtml(r?.interpretation?.general || 'No reading available.')}</div>
      </div>
      ${r?.currentDasa ? `
      <div class="section-block">
        <div class="section-label">Current Dasa Period</div>
        <div class="section-text">${escapeHtml(r.currentDasa)}</div>
      </div>` : ''}
      <div class="two-col">
        ${r?.interpretation?.career ? `
        <div class="section-block">
          <div class="section-label">Career</div>
          <div class="section-text">${escapeHtml(r.interpretation.career)}</div>
        </div>` : ''}
        ${r?.interpretation?.relationships ? `
        <div class="section-block">
          <div class="section-label">Relationships</div>
          <div class="section-text">${escapeHtml(r.interpretation.relationships)}</div>
        </div>` : ''}
        ${r?.interpretation?.health ? `
        <div class="section-block">
          <div class="section-label">Health</div>
          <div class="section-text">${escapeHtml(r.interpretation.health)}</div>
        </div>` : ''}
        ${r?.interpretation?.finance ? `
        <div class="section-block">
          <div class="section-label">Finance</div>
          <div class="section-text">${escapeHtml(r.interpretation.finance)}</div>
        </div>` : ''}
      </div>
      ${renderStrengths(r?.strengths, r?.challenges)}
    `;

    // ── Planets ──
    renderPlanets(r, chart);

    // ── Houses ──
    renderHouses(r);

    // ── Yogas & Doshas ──
    renderYogas(r);

    // ── Navamsa D9 ──
    renderD9(r);

    // ── Remedies ──
    renderRemedies(r);

    // Also update planetary dignities
    renderDignities(r);

    // Panchamahapurusha Yogas
    renderPanchamahapurusha(r);
  }

  function renderStrengths(strengths, challenges) {
    let html = '<div class="two-col" style="margin-top:12px">';
    if (strengths?.length) {
      html += '<div class="section-block"><div class="section-label">✨ Strengths</div><ul style="font-size:0.85rem;padding-left:18px">';
      strengths.forEach(s => html += `<li style="margin-bottom:4px">${escapeHtml(s)}</li>`);
      html += '</ul></div>';
    }
    if (challenges?.length) {
      html += '<div class="section-block"><div class="section-label">⚠️ Challenges</div><ul style="font-size:0.85rem;padding-left:18px">';
      challenges.forEach(c => html += `<li style="margin-bottom:4px">${escapeHtml(c)}</li>`);
      html += '</ul></div>';
    }
    html += '</div>';
    return html;
  }

  function renderPlanets(r, chart) {
    const container = document.getElementById('planetsContent');

    // Dignities
    if (r?.planetaryDignities?.length) {
      let html = '<div class="section-block"><div class="section-label">Planetary Dignity</div><div class="planet-grid">';
      r.planetaryDignities.forEach(p => {
        const badgeClass = ['exalted','moolatrikona','own'].includes(p.dignity) ? 'exalted' :
                          ['friendly','neutral'].includes(p.dignity) ? '' : 'enemy';
        html += `
          <div class="planet-card">
            <div class="name">${escapeHtml(p.planet)} <span class="dignity-badge ${badgeClass}">${p.dignity}</span></div>
            <div class="sub">${escapeHtml(p.explanation)}</div>
            ${p.isCombust ? '<div class="sub" style="color:var(--red)">🔥 Combust — weakened by Sun</div>' : ''}
            ${p.retrogradeEffect ? `<div class="sub" style="color:var(--yellow)">↩ ${escapeHtml(p.retrogradeEffect)}</div>` : ''}
          </div>`;
      });
      html += '</div></div>';
      container.innerHTML = html;
    }

    // Aspects
    if (r?.aspects?.summary?.length) {
      let html = '<div class="section-block"><div class="section-label">Planetary Aspects</div>';
      r.aspects.summary.forEach(s => {
        html += `<div class="section-text" style="margin-bottom:6px">• ${escapeHtml(s)}</div>`;
      });
      html += '</div>';
      container.innerHTML += html;
    }

    // Panchamahapurusha
    if (r?.panchamahapurushaYogas?.length) {
      let html = '<div class="section-block"><div class="section-label">🌟 Panchamahapurusha Yogas</div>';
      r.panchamahapurushaYogas.forEach(y => {
        html += `<div class="planet-card" style="margin-bottom:8px">
          <div class="name">${escapeHtml(y.name)} <span style="color:var(--accent);font-size:0.8rem">(${escapeHtml(y.planet)})</span></div>
          <div class="desc">${escapeHtml(y.description)}</div>
        </div>`;
      });
      html += '</div>';
      container.innerHTML += html;
    }

    // Planet positions from chart
    if (chart?.planets?.length) {
      let html = '<div class="section-block"><div class="section-label">Planet Positions</div><div class="planet-grid">';
      chart.planets.forEach(p => {
        const signName = getSignName(p.sign);
        const ret = p.isRetrograde ? '↩' : '';
        html += `
          <div class="planet-card">
            <div class="name">${escapeHtml(p.name?.en || '?')} ${ret}</div>
            <div class="sub">${signName} ${p.signDegree?.toFixed(2)}° — House ${p.house}</div>
            <div class="sub" style="font-size:0.75rem">Nakshatra: ${p.nakshatra || '—'} (${p.nakshatraLord || '—'})</div>
            <div class="desc">${escapeHtml(getPositionShort(p))}</div>
          </div>`;
      });
      html += '</div></div>';
      container.innerHTML += html;
    }
  }

  function renderHouses(r) {
    const container = document.getElementById('housesContent');
    if (!r?.houseInfluences?.length) { container.innerHTML = '<div class="loading-skeleton">No house data available.</div>'; return; }

    let html = '<div class="planet-grid">';
    r.houseInfluences.forEach(h => {
      const lines = h.split('\n');
      html += `<div class="house-card">
        <div class="name">${escapeHtml(lines[0])}</div>
        <div class="desc">${escapeHtml(lines.slice(1).join(' ').trim())}</div>
      </div>`;
    });
    html += '</div>';
    container.innerHTML = html;
  }

  function renderYogas(r) {
    const container = document.getElementById('yogasContent');
    let html = '';

    if (r?.yogas?.length) {
      html += '<div class="section-block"><div class="section-label">🌟 Beneficial Yogas</div>';
      r.yogas.forEach(y => {
        html += `<div class="planet-card" style="margin-bottom:8px">
          <div class="name">${escapeHtml(y.name)}</div>
          <div class="desc">${escapeHtml(y.description)}</div>
        </div>`;
      });
      html += '</div>';
    }

    if (r?.doshas?.length) {
      html += '<div class="section-block"><div class="section-label">⚠️ Doshas (Afflictions)</div>';
      r.doshas.forEach(d => {
        const sev = d.severity === 'high' ? '🔴 High' : d.severity === 'medium' ? '🟡 Medium' : '🟢 Low';
        html += `<div class="planet-card" style="margin-bottom:8px">
          <div class="name">${escapeHtml(d.name)} <span style="font-size:0.75rem;color:var(--text-dim)">${sev}</span></div>
          <div class="desc">${escapeHtml(d.description)}</div>
        </div>`;
      });
      html += '</div>';
    }

    if (!r?.yogas?.length && !r?.doshas?.length) {
      html = '<div class="loading-skeleton">No yogas or doshas data available.</div>';
    }

    container.innerHTML = html;
  }

  function renderD9(r) {
    const container = document.getElementById('d9Content');
    if (!r?.navamsa) { container.innerHTML = '<div class="loading-skeleton">No Navamsa data available.</div>'; return; }

    let html = `<div class="section-block"><div class="section-label">Navamsa (D9) Chart</div>`;
    html += `<div class="section-text">Navamsa Lagna: <strong>${getSignName(r.navamsa.lagna)}</strong></div>`;

    if (r.navamsa.vargottamaPlanets?.length) {
      html += `<div class="section-text" style="margin-top:8px">💎 Vargottama planets (same in both charts): <strong>${r.navamsa.vargottamaPlanets.join(', ')}</strong></div>`;
    }

    if (r.navamsa.marriageAnalysis?.length) {
      html += '<div class="section-block" style="margin-top:12px"><div class="section-label">Marriage / Relationship Analysis</div>';
      r.navamsa.marriageAnalysis.forEach(m => {
        html += `<div class="section-text" style="margin-bottom:6px">• ${escapeHtml(m)}</div>`;
      });
      html += '</div>';
    }

    if (r.navamsa.planetPlacements?.length) {
      html += '<div class="section-block" style="margin-top:12px"><div class="section-label">Planets in D9</div><div class="planet-grid">';
      r.navamsa.planetPlacements.forEach(p => {
        html += `<div class="planet-card">
          <div class="name">${escapeHtml(p.planet)} <span style="color:var(--accent);font-size:0.8rem">→ ${escapeHtml(p.sign)}</span></div>
          <div class="desc">${escapeHtml(p.interpretation)}</div>
        </div>`;
      });
      html += '</div></div>';
    }

    html += '</div>';
    container.innerHTML = html;
  }

  function renderRemedies(r) {
    const container = document.getElementById('remediesContent');
    if (!r?.remedies?.length) { container.innerHTML = '<div class="loading-skeleton">No remedies data available.</div>'; return; }

    let html = '<div class="section-block"><div class="section-label">🪬 Recommended Remedies</div><div class="two-col">';
    r.remedies.forEach(rem => {
      html += `<div class="remedy-item">
        <span class="planet-name">${escapeHtml(rem.planet)}</span>
        <div class="r-field"><strong>Gemstone:</strong> ${rem.gem || 'None specific'}</div>
        <div class="r-field"><strong>Mantra:</strong> <code style="font-size:0.75rem;color:var(--accent)">${escapeHtml(rem.mantra)}</code></div>
        <div class="r-field"><strong>Action:</strong> ${escapeHtml(rem.action)}</div>
      </div>`;
    });
    html += '</div></div>';
    container.innerHTML = html;
  }

  function renderDignities(r) {
    // Already rendered inside Planets tab
  }

  function renderPanchamahapurusha(r) {
    // Already rendered inside Planets tab
  }

  // ─── Helpers ──────────────────────────────────────────
  function getSignName(sign) {
    const names = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
    return names[sign] || `Sign ${sign}`;
  }

  function getPositionShort(p) {
    const dignities = { exalted: '✨ Exalted', debilitated: '⚠️ Debilitated', own: '👑 Own sign' };
    return dignities[p.dignity] || `In ${getSignName(p.sign)}`;
  }

  function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function setLoading(loading) {
    computeBtn.disabled = loading;
    btnText.classList.toggle('hidden', loading);
    btnSpinner.classList.toggle('hidden', !loading);
  }

  function showError(msg) {
    errorMessage.textContent = msg;
    errorCard.style.display = 'block';
    errorCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
});
