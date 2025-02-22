/* Magic Mirror
 * Node Helper: MMM-BibleVerseClock
 *
 * By Nathan O'Grady
 * MIT Licensed.
 */

const NodeHelper = require("node_helper");
//const fetch = require("node-fetch");

async function fetchChapter(translationCode, book, chapter) {
    try {
        const {
        default:
            fetch
        } = await import('node-fetch');
        const url = `https://bible.helloao.org/api/${translationCode}/${book}/${chapter}.json`;
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        //Skip this error, as it will always trigger if attempting to pull a chapter number that doesn't exist in a book.
        //Since the loop will check every book each time, this will always start cluttering the log.
        //console.error("Error fetching chapter:", error);
        return null;
    }
}

async function getVerse(hour, minute, translationCode, BibleTimeFormat) { // Default to BSB translation
    if (hour < 1 || hour > 24 || minute < 1 || minute > 60) {
        return "Invalid time";
    }

    if (BibleTimeFormat == '') {
        BibleTimeFormat = '12';
    }
    var displayHour = ''

        if (BibleTimeFormat == '12') {
            displayHour = hour > 12 ? hour - 12 : hour; // For 12-hour display. Remove if you want 24.
        } else {
            displayHour = hour;
        }

        const possibleVerses = [];
    const bookNames = await getBookNames(translationCode); // Get the book names for the chosen translation

    if (!bookNames.books) {
        return "Could not retrieve book names for the selected translation."
    }

    for (const book of bookNames.books) {
        const chapterData = await fetchChapter(translationCode, book, displayHour);

        if (chapterData && chapterData.chapter && chapterData.chapter.content) {
            for (const contentItem of chapterData.chapter.content) {
                if (contentItem.type === "verse" && contentItem.number === minute) {
                    //Handles cases where there are multiple verses with the same number.
                    let verseText = "";
                    for (const versePart of contentItem.content) {
                        if (typeof versePart === 'string') {
                            verseText += versePart + " ";
                        } else if (versePart.heading) {
                            verseText += versePart.heading + " ";
                        }
                    }

                    if (verseText != "") {
                        possibleVerses.push({
                            book: chapterData.book.commonName, // Use common name
                            verse: verseText
                        });
                        break; // Found the verse, no need to check other content in this chapter
                    }
                }
            }
        }
    }

    if (possibleVerses.length === 0) {
        console.debug("No verse found for " + displayHour + ":" + minute);
        return "No verse found for that time.";
    }

    const randomVerseData = possibleVerses[Math.floor(Math.random() * possibleVerses.length)];
    const returnVerse = {
        book: randomVerseData.book,
        chapterNumber: displayHour,
        verseNumber: minute,
        verseText: randomVerseData.verse,
        translation: bookNames.translationName,
    }
    return returnVerse;
}

async function getBookNames(translationCode) {
    try {
        const {
        default:
            fetch
        } = await import('node-fetch');
        const url = `https://bible.helloao.org/api/${translationCode}/books.json`;
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        const returnValue = {
            translationName: data.translation.name,
            books: data.books.map(book => book.id), // Return an array of book IDs
        }
        return returnValue;
    } catch (error) {
        console.error("Error fetching book names:", error);
        throw error;
    }
}

module.exports = NodeHelper.create({
    // Subclass start method.
    start: function () {
        console.debug("Started node_helper.js for MMM-BibleVerseClock.");
    },

    socketNotificationReceived: function (notification, configPayload) {
        const configTranslation = configPayload.version;
        const configBibleTimeFormat = configPayload.BibleTimeFormat;
        console.debug(this.name + " node helper received a socket notification: " + notification);
        this.displayVerse(notification, configTranslation, configBibleTimeFormat);
    },

    displayVerse: async function (notification, configTranslation, configBibleTimeFormat) {
        var self = this;
        // the time computation gets the next minute, not the current minute.
        // it is assumed that the API calls will take a little time to process, so getting the next
        // minute and then pausing display in MMM-BibleVerseClock.js will make the "clock" part accurate
        const now = new Date();
        let currentHour = now.getHours();
        let currentMinute = notification == "START_PRIME" ? now.getMinutes() : now.getMinutes() + 1;
        if (currentMinute === 60) {
            currentMinute = 1;
            currentHour = (currentHour + 1) % 24;
        }
        // Midnight will be hour 0, so it needs to be faked to be hour 12.
        if (currentHour === 0) {
            currentHour = 12;
        }

        if (configTranslation == '') {
            configTranslation = 'BSB';
        }

        try {
            const returnVerse = await getVerse(currentHour, currentMinute, configTranslation, configBibleTimeFormat);
            self.sendSocketNotification('BIBLE_RESULT', returnVerse);
        } catch (error) {
            console.error("Error in displayVerse: " + error);
            self.sendSocketNotification('BIBLE_ERROR', "Error fetching verse");
        }
    }

});
