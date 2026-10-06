const MAX_SIZE = 300;
const INNER_RATIO = 0.6;
/**
 * Slice colors live in stats.css (--slice-1 … --slice-6, --slice-other). Six hues because those
 * six stay distinguishable for color-blind viewers whichever two end up side by side in a donut.
 */
const COLOR_SLOTS = 6;

/**
 * Colors the six largest slices and folds anything beyond them into one gray slice, which always
 * sits last (between slice 6 and slice 1). Expects data largest-first.
 */
function foldIntoOther(data, label, value, otherLabel) {
  const kept = data.slice(0, COLOR_SLOTS).map((d, index) => ({
    label: label(d),
    value: value(d),
    color: `var(--slice-${index + 1})`,
  }));
  const rest = data.slice(COLOR_SLOTS);
  if (rest.length === 0) return kept;
  return [
    ...kept,
    {
      label: rest.length === 1 ? label(rest[0]) : otherLabel,
      value: d3.sum(rest, value),
      color: 'var(--slice-other)',
    },
  ];
}

/** Donut chart with a legend. Accessors: label(d), value(d). Data must be sorted largest-first. */
export function renderPieChart(
  container,
  data,
  { label, value, centerCaption, ariaLabel, footnote = '', otherLabel = 'other' },
) {
  const root = d3.select(container);
  root.selectAll('*').remove();

  const total = d3.sum(data, value);
  if (total === 0) {
    root.append('p').attr('class', 'muted').text('No data yet.');
    return;
  }

  const slices = foldIntoOther(data, label, value, otherLabel);
  const percent = (d) => `${Math.round((d.value / total) * 100)}%`;

  const size = Math.min(container.clientWidth, MAX_SIZE);
  const radius = size / 2;
  const arc = d3
    .arc()
    .innerRadius(radius * INNER_RATIO)
    .outerRadius(radius - 8)
    .cornerRadius(4);
  const arcRaised = d3
    .arc()
    .innerRadius(radius * INNER_RATIO)
    .outerRadius(radius - 1)
    .cornerRadius(4);
  // sort(null) keeps our order (largest first) instead of letting D3 reorder the slices.
  const arcs = d3
    .pie()
    .value((d) => d.value)
    .sort(null)(slices);

  const layout = root.append('div').attr('class', 'pie-chart');
  const svg = layout
    .append('svg')
    .attr('class', 'chart pie-chart__donut')
    .attr('viewBox', `${-radius} ${-radius} ${size} ${size}`)
    .style('max-width', `${size}px`)
    .attr('role', 'img')
    .attr('aria-label', ariaLabel);

  const paths = svg
    .append('g')
    .selectAll('path')
    .data(arcs)
    .join('path')
    .attr('class', 'chart-slice')
    .style('fill', (d) => d.data.color)
    .call((all) =>
      all.append('title').text((d) => `${d.data.label}: ${d.data.value} (${percent(d.data)})`),
    );

  // Opening animation: every slice sweeps clockwise from 12 o'clock to its final angle.
  paths
    .transition()
    .duration(700)
    .attrTween('d', (d) => {
      const interpolate = d3.interpolate({ startAngle: 0, endAngle: 0 }, d);
      return (t) => arc(interpolate(t));
    });

  const centerValue = svg.append('text').attr('class', 'pie-chart__value').attr('dy', '-0.1em');
  const centerLabel = svg.append('text').attr('class', 'pie-chart__label').attr('dy', '1.4em');

  const legendItems = layout
    .append('ul')
    .attr('class', 'pie-chart__legend')
    .selectAll('li')
    .data(slices)
    .join('li')
    .attr('class', 'pie-chart__item');
  legendItems
    .append('span')
    .attr('class', 'pie-chart__swatch')
    .style('background', (d) => d.color);
  legendItems
    .append('span')
    .attr('class', 'pie-chart__name')
    .text((d) => d.label);
  legendItems
    .append('span')
    .attr('class', 'pie-chart__count')
    .text((d) => `${d.value} · ${percent(d)}`);

  if (footnote) layout.append('p').attr('class', 'muted small pie-chart__note').text(footnote);

  /** Highlights one slice (by index) in the donut, the center and the legend; null resets. */
  function highlight(activeIndex) {
    const active = activeIndex === null ? null : slices[activeIndex];
    paths
      .interrupt()
      .classed('is-dimmed', (_, index) => active !== null && index !== activeIndex)
      .attr('d', (d, index) => (index === activeIndex ? arcRaised(d) : arc(d)));
    legendItems.classed('is-active', (_, index) => index === activeIndex);
    centerValue.text(active ? active.value : total);
    centerLabel.text(active ? `${active.label} · ${percent(active)}` : centerCaption);
  }

  paths.on('mouseenter', (_, d) => highlight(d.index)).on('mouseleave', () => highlight(null));
  legendItems
    .on('mouseenter', (_, d) => highlight(slices.indexOf(d)))
    .on('mouseleave', () => highlight(null));

  centerValue.text(total);
  centerLabel.text(centerCaption);
}
