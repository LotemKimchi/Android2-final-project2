const HEIGHT = 300;
const MARGIN = { top: 20, right: 20, bottom: 55, left: 45 };

/** Line + area chart over ordinal x values. Accessors: x(d), y(d). */
export function renderLineChart(container, data, { x, y, formatX = String, label }) {
  const root = d3.select(container);
  root.selectAll('*').remove();

  const width = Math.max(container.clientWidth, 320);
  const maxY = d3.max(data, y) || 1;
  const xScale = d3
    .scalePoint()
    .domain(data.map(x))
    .range([MARGIN.left, width - MARGIN.right])
    .padding(0.5);
  const yScale = d3
    .scaleLinear()
    .domain([0, maxY])
    .nice()
    .range([HEIGHT - MARGIN.bottom, MARGIN.top]);

  const svg = root
    .append('svg')
    .attr('class', 'chart')
    .attr('viewBox', `0 0 ${width} ${HEIGHT}`)
    .attr('role', 'img')
    .attr('aria-label', label);

  svg
    .append('g')
    .attr('class', 'chart-axis')
    .attr('transform', `translate(0,${HEIGHT - MARGIN.bottom})`)
    .call(d3.axisBottom(xScale).tickFormat(formatX))
    .selectAll('text')
    .attr('transform', 'rotate(-35)')
    .style('text-anchor', 'end');

  svg
    .append('g')
    .attr('class', 'chart-axis')
    .attr('transform', `translate(${MARGIN.left},0)`)
    .call(d3.axisLeft(yScale).ticks(Math.min(maxY, 6)).tickFormat(d3.format('d')));

  const px = (d) => xScale(x(d));
  const py = (d) => yScale(y(d));

  svg
    .append('path')
    .datum(data)
    .attr('class', 'chart-area')
    .attr('d', d3.area().x(px).y0(yScale(0)).y1(py));

  svg.append('path').datum(data).attr('class', 'chart-line').attr('d', d3.line().x(px).y(py));

  svg
    .append('g')
    .selectAll('circle')
    .data(data)
    .join('circle')
    .attr('class', 'chart-dot')
    .attr('cx', px)
    .attr('cy', py)
    .attr('r', 0)
    .call((dots) => dots.append('title').text((d) => `${formatX(x(d))}: ${y(d)}`))
    .transition()
    .duration(500)
    .attr('r', 5);
}
