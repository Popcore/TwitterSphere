import nltk
import sys
import json
import tweets_training
import datetime
import time
#nltk.download()

# extract words (bag of words)
def bagOfWords(tweets):
	wordList = []
	for(words, sentiment) in tweets:
		wordList.extend(words)

	return wordList

def wordFeatures(wordList):
	wordList = nltk.FreqDist(wordList)
	wordfeatures = wordList.keys()

	return wordfeatures

def getFeatures(doc):
	docWords = set(doc)
	feat = {}
	for word in word_features:
		feat['contains(%s)' % word] = (word in docWords)

	return feat

corpusOfTweet = []
tweetList = tweets_training.positiveTweets + tweets_training.negativeTweets + tweets_training.neutralTweets

for words, sentiment in tweetList:
	wordsFiltered = [e.lower() for e in nltk.word_tokenize(words) if len(e) >= 3]
	corpusOfTweet.append((wordsFiltered, sentiment))

word_features = wordFeatures(bagOfWords(corpusOfTweet))

training = nltk.classify.apply_features(getFeatures, corpusOfTweet)
classifier = nltk.NaiveBayesClassifier.train(training)
possible_values = { 'positive' : 1, 'neutral' : 0, 'negative' : -1 }
#print(classifier.show_most_informative_features(15))

# print string passed form node
# 2. PROCESS STREMING DATA
#for line in sys.stdin:
#	print 'TWEET BODY: ' + line[:]
#	print 'SENTIMENT ' + classifier.classify(getFeatures(line[:-1].split()))

# 1. PROCESS SEARCH DATA
now_timestamp = int(time.time())
for tweet in sys.stdin:
	json_data =  json.loads(tweet)
	for i, j in enumerate(json_data):
		tweet_text = json_data[i]['text']
		tweet_age = json_data[i]['created_at']
		month_day_time = tweet_age[:len(tweet_age) - 10]
		year = tweet_age[len(tweet_age) - 4:]
		full_date = month_day_time + year
		date_timestamp = time.mktime(datetime.datetime.strptime(full_date, '%a %b %d %H:%M:%S %Y').timetuple())
		tweet_hashtags = json_data[i]['entities']['hashtags']
		tweet_hashtags_list = []
		for k, l in enumerate(tweet_hashtags):
			tweet_hashtags_list.append(tweet_hashtags[k]['text'])
		tweet_sentiment = classifier.classify(getFeatures(tweet_text.split()))
		tweet_popularity = json_data[i]['retweet_count']
		#user_geo = json_data[i]
		user_followers = json_data[i]['user']['followers_count']

		tweet_data = { 
			'tweet_text' : tweet_text, 
			'tweet_age' : now_timestamp - date_timestamp,
			'tweet_hashtags' : tweet_hashtags_list, 
			'tweet_sentiment' : possible_values[tweet_sentiment], 
			'tweet_popularity' : tweet_popularity, 
			'user_followers' : user_followers 
		}

		print json.dumps(tweet_data, ensure_ascii=True)
