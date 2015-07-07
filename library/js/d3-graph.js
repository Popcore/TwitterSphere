(function() {

	var dataset = [
  	{ label: 'Betelgeuse', count: 30 },
  	{ label: 'Cantaloupe', count: 30 },
  	{ label: 'Dijkstra', count: 40 }
	];

	var color = d3.scale.ordinal()
  .range(['#41baec', '#f4f5d8', '#e03a63']); 

	var svg = d3.select('#mood-info')
		.append('svg')
		.attr('width', 200)
		.attr('height', 200)
		.append('g')
		.attr('transform', 'translate(' + 100 +  ',' + 100 + ')');

	var arc = d3.svg.arc()
		.innerRadius(40)
		.outerRadius(100);

	var pie = d3.layout.pie()
		.value(function(d) { return d.count; })
		.sort(null);

	var path = svg.selectAll('path')
		.data(pie(dataset))
		.enter()
		.append('path')
		.attr('d', arc)
		.attr('fill', function(d, i) {
			return color(d.data.label);
		});

}()) 


 