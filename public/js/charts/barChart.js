const BAR_HEIGHT = 30;
const MARGIN = { top: 10, right: 50, bottom: 30, left: 160 };
const MAX_LABEL_CHARS = 22;

const truncate = (text) =>
  text.length > MAX_LABEL_CHARS ? `${text.slice(0, MAX_LABEL_CHARS - 1)}…` : text;

/** Horizontal bar chart. Accessors: label(d), value(d). */
export function renderHorizontalBarChart(container, data, { label, value, unit, ariaLabel }) {
  const root = d3.select(container);
  root.selectAll('*').remove();
  if (data.length === 0) {
    root.append('p').attr('class', 'muted').text('No data yet.');
    return;
  }

  const width = Math.max(container.clientWidth, 320);
  const height = MARGIN.top + MARGIN.bottom + BAR_HEIGHT * data.length;
  const maxValue = d3.max(data, value) || 1;
  const xScale = d3
    .scaleLinear()
    .domain([0, maxValue])
    .nice()
    .range([MARGIN.left, width - MARGIN.right]);
  const yScale = d3
    .scaleBand()
    .domain(data.map((_, index) => index))
    .range([MARGIN.top, height - MARGIN.bottom])
    .padding(0.2);

  const svg = root
    .append('svg')
    .attr('class', 'chart')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .attr('role', 'img')
    .attr('aria-label', ariaLabel);

  svg
    .append('g')
    .attr('class', 'chart-axis')
    .attr('transform', `translate(0,${height - MARGIN.bottom})`)
    .call(d3.axisBottom(xScale).ticks(Math.min(maxValue, 5)).tickFormat(d3.format('d')));

  svg
    .append('g')
    .attr('class', 'chart-axis')
    .attr('transform', `translate(${MARGIN.left},0)`)
    .call(d3.axisLeft(yScale).tickFormat((index) => truncate(label(data[index]))));

  svg
    .append('g')
    .selectAll('rect')
    .data(data)
    .join('rect')
    .attr('class', 'chart-bar')
    .attr('x', xScale(0))
    .attr('y', (_, index) => yScale(index))
    .attr('height', yScale.bandwidth())
    .attr('rx', 4)
    .attr('width', 0)
    .call((bars) => bars.append('title').text((d) => `${label(d)}: ${value(d)} ${unit}`))
    .transition()
    .duration(600)
    .attr('width', (d) => xScale(value(d)) - xScale(0));

  svg
    .append('g')
    .selectAll('text')
    .data(data)
    .join('text')
    .attr('class', 'chart-value')
    .attr('x', (d) => xScale(value(d)) + 6)
    .attr('y', (_, index) => yScale(index) + yScale.bandwidth() / 2)
    .attr('dy', '0.35em')
    .text(value);
}
