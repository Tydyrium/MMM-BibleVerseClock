//BibleVerseClock.js

Module.register("MMM-BibleVerseClock", {
    // Default module config.
    result: [],
    defaults: {
        // Default Bible version is BSB.
        // Change it to a supported version.
        // https://bible.helloao.org/api/available_translations.json
        version: 'BSB',
        size: 'medium',
        BibleTimeFormat: '12',
    },

    start: function () {
        Log.info("Starting module: " + this.name);
        var self = this;

        var configuredVersion = this.config.version;
        var configuredTime = this.config.BibleTimeFormat;

        //Do this once first
        self.sendSocketNotification('START_PRIME', this.config);
        setTimeout(() => {
            self.sendSocketNotification('START_REPEAT', this.config);
        }, 10000); //get the next minute early, but with a little delay off the prime, so they don't race and collide.

        //Then every minute
        setInterval(() => {
            self.sendSocketNotification('START_REPEATING', this.config);
        }, 60000); //perform every minute (60000 milliseconds)
    },

    getStyles: function () {
        return ["MMM-BibleVerseClock.css"];
    },

    // Override dom generator.
    getDom: function () {
        Log.debug("Updating MMM-BibleVerseClock DOM.");

        var verse = "";
        const now = new Date();
        let currentHour = now.getHours();
        if (this.config.BibleTimeFormat == '12') {
            currentHour = currentHour > 12 ? currentHour - 12 : currentHour;
        }
        // midnight will return hour 0, so fake it to 12.
        if (currentHour === 0) {
            currentHour = 12;
        }
        let currentMinute = now.getMinutes();
        const wrapper = document.createElement("div");
        if (!this.bookSpan) { //do this only once
            this.bookSpan = document.createElement("span");
            this.bookSpan.className = "book";

            this.referenceSpan = document.createElement("span");
            this.referenceSpan.className = "reference";

            this.verseSpan = document.createElement("span");
            this.verseSpan.className = "verseText";

            this.translationSpan = document.createElement("span");
            this.translationSpan.className = "translation";

        }
        if (currentHour == this.votmchapterNumber && currentMinute == this.votmverseNumber) {
            if (this.votmverseText != null) {
                this.bookSpan.textContent = this.votmBook + " ";
                this.referenceSpan.textContent = this.votmchapterNumber < 10 ? "0" + this.votmchapterNumber : this.votmchapterNumber;
                this.referenceSpan.textContent += ":";
                this.referenceSpan.textContent += this.votmverseNumber < 10 ? "0" + this.votmverseNumber : this.votmverseNumber;
                if (this.config.BibleTimeFormat == '12') {
                    if (now.getHours() > 12) {
                        this.referenceSpan.textContent += " (PM)";
                    } else {
                        this.referenceSpan.textContent += " (AM)";
                    }
                }
                this.verseSpan.textContent = this.votmverseText;
                this.translationSpan.textContent = this.votmtranslation;
            }
        } else {
            this.bookSpan.textContent = '';
            this.referenceSpan.textContent = currentHour < 10 ? "0" + currentHour : currentHour;
            this.referenceSpan.textContent += ":";
            this.referenceSpan.textContent += currentMinute < 10 ? "0" + currentMinute : currentMinute;
            if (this.config.BibleTimeFormat == '12') {
                if (now.getHours() > 12) {
                    this.referenceSpan.textContent += " (PM)";
                } else {
                    this.referenceSpan.textContent += " (AM)";
                }
            }
            this.verseSpan.textContent = "Pause and Reflect";
            this.translationSpan.textContent = "No verse found for this time code";
        }
        wrapper.appendChild(this.bookSpan);
        wrapper.appendChild(this.referenceSpan);
        wrapper.appendChild(document.createElement("br"));
        wrapper.appendChild(this.verseSpan);
        wrapper.appendChild(document.createElement("br"));
        wrapper.appendChild(this.translationSpan);

        switch (this.config.size) {
        case 'xsmall':
            wrapper.className = "bright xsmall";
            break;
        case 'small':
            wrapper.className = "bright small";
            break;
        case 'medium':
            wrapper.className = "bright medium";
            break;
        case 'mediumNarrow':
            wrapper.className = "bright mediumNarrow";
            break;
        case 'large':
            wrapper.className = "bright large";
            break;
        default:
            wrapper.className = "bright medium";
        }
        return wrapper;
    },

    getScripts: function () {
        return [
            this.file('jquery-3.1.1.min.js'), // this file will be loaded straight from the module folder.
        ]
    },

    socketNotificationReceived: function (notification, payload) {
        Log.debug("socket received from Node Helper " + notification + " - payload: " + JSON.stringify(payload));
        if (notification === "BIBLE_RESULT" && payload) {
            this.votmBook = payload.book;
            this.votmchapterNumber = payload.chapterNumber;
            this.votmverseNumber = payload.verseNumber;
            this.votmverseText = payload.verseText;
            this.votmtranslation = payload.translation;

            const now = new Date();
            let currentHour = now.getHours();
            if (currentHour === 0) {
                currentHour = 12;
            }
            let currentMinute = now.getMinutes();
            if (currentHour === this.votmchapterNumber && currentMinute === this.votmverseNumber) {
                this.updateDom();
            } else {
                let currentHour = now.getHours();
                let nextUpdateTime = new Date();
                nextUpdateTime.setHours(this.votmchapterNumber);
                nextUpdateTime.setMinutes(this.votmverseNumber);
                nextUpdateTime.setSeconds(0);
                nextUpdateTime.setMilliseconds(0);
                if (this.config.BibleTimeFormat == '12' && currentHour > 12) {
                    nextUpdateTime.setHours(this.votmchapterNumber + 12);
                } else if ((currentHour === 0 || currentHour === 23) && this.votmchapterNumber === 12) {
                    nextUpdateTime.setHours(0); //translate back from converting midnight to 12 to load a verse.
                }
                if ((nextUpdateTime + 60000) < now) {
                    nextUpdateTime.setDate(now.getDate() + 1);
                }
                const timeUntilUpdate = nextUpdateTime.getTime() - now.getTime();

                if (timeUntilUpdate < 0 && timeUntilUpdate > -60000) {
                    this.updateDom();
                } else if (timeUntilUpdate < 0) {
                    Log.warn("timeUntilUpdate is negative!");
                } else if (timeUntilUpdate > 300000) {
                    Log.warn("timeUntilUpdate is larger than expected: " + timeUntilUpdate);
                } else {
                    setTimeout(() => {
                        this.updateDom();
                    }, timeUntilUpdate);
                }
            }
        }
    }
});
