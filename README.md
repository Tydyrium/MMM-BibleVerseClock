# MMM-BibleVerseClock
This an extension for the [MagicMirror](https://github.com/MichMich/MagicMirror). It will get a verse from https://bible.helloao.org/docs/ corresponding to the current time. You can change the version Bible in the config file. You can also change between a 12 and 24 hour clock in the config file. Here is a list of the supported Bible versions: https://bible.helloao.org/api/available_translations.json

This will display the accurate time, for the hours and minutes that have a corresponding verse number.  However, as there are multiple holes where an hour and minute combination does not correlate to an actual verse, this clock will not display the accurate time at that point.  By my count, there are 94 missing minutes of the 1,440 minutes in a day.  Meaning this clock will be not have a verse 6.53% of the day.
It is also not capable of showing every verse in the Bible, as some chapters and verses are outside of the range of valid timecodes.  When running in 12 hr view, it will randomly show from about 43.8% of verses.  While in 24 hr view, that increases to 70.3%.

Also, this is not as light as other modules.  It is making multiple API calls every minute in order to refresh its data.  I have only tested it on a standalone computer implementation, not on a pi.  So I cannot guarantee it will work there.

## Installation
1. Navigate into your MagicMirror's `modules` folder 
2. Execute `git clone https://github.com/arthurgarzajr/MMM-BibleVerseClock.git`
3. Navigate to newly created folder `MMM-BibleVerseClock`
4. Execute `npm install`

## Using the module

To use this module, add it to the modules array in the `config/config.js` file:
````javascript
modules: [
	{
		module: 'MMM-BibleVerseClock',
		position: 'bottom_bar',	// This can be any of the regions. Best result is in the bottom_bar as verses can take multiple lines in a day.
		config: {
			version: 'BSB', // This can be changed to any version you want that is offered by Bible API. For a list, go here: https://bible.helloao.org/api/available_translations.json,
	    	size: 'small', // default value is medium, but can be changed. 
			BibleTimeFormat: '12', // This can be set to 12 or 24.
		}
	}
]
````

## Configuration options

The following properties can be configured:


<table width="100%">
	<!-- why, markdown... -->
	<thead>
		<tr>
			<th>Option</th>
			<th width="100%">Description</th>
		</tr>
	<thead>
	<tbody>
		<tr>
			<td><code>version</code></td>
			<td>Here is a list of the supported Bible versions: https://bible.helloao.org/api/available_translations.json
      		<br/>
			Note that <code>version</code> also determines the language of the Bible verse. The language of the Bible reference, i.e. name of the book, is determined by the global <code>language</code> parameter in your config 
			<br/>
      		Examples: <code>BSB</code>, <code>eng_asv</code>, <code>eng_lsv</code>, etc.
			</td>
		</tr>
		<tr>
			<td><code>size</code></td>
			<td>Default size is medium but it can be overriden with <code>xsmall</code>, <code>small</code> or <code>large</code>.</td>
		</tr>
		<tr>
		    <td><code>BibleTimeFormat</code></td>
			<td>Default is 12 hour clock, but can be changed to 24 hour with <code>12</code> or <code>24</code>.</td>
		</tr>
	</tbody>
</table>

## Dependencies
- Access to the internet to download verses from https://bible.helloao.org
- npm package `request`

The MIT License (MIT)
=====================

Copyright © 2016-2017 Arthur Garza

Permission is hereby granted, free of charge, to any person
obtaining a copy of this software and associated documentation
files (the “Software”), to deal in the Software without
restriction, including without limitation the rights to use,
copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following
conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

**The software is provided “as is”, without warranty of any kind, express or implied, including but not limited to the warranties of merchantability, fitness for a particular purpose and noninfringement. In no event shall the authors or copyright holders be liable for any claim, damages or other liability, whether in an action of contract, tort or otherwise, arising from, out of or in connection with the software or the use or other dealings in the software.**
