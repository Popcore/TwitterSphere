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
	json_data  =  json.loads(tweet)

	for i, j in enumerate(json_data):
		tweet_text 					= json_data[i]['text']
		tweet_birth_ts			= json_data[i].get('timestamp_ms', now_timestamp)
		tweet_hashtags 			= json_data[i]['entities']['hashtags']
		tweet_popularity 		= json_data[i]['retweet_count']
		user_followers			= json_data[i]['user']['followers_count']
		tweet_hashtags_list = []
		retweet 						= {}
		tweet_id 						= json_data[i]['id']

		if 'retweeted_status' in json_data[i]:
			retweet['id']     = json_data[i]['retweeted_status']['id']

		for k, l in enumerate(tweet_hashtags):
			tweet_hashtags_list.append(tweet_hashtags[k]['text'])

		tweet_sentiment 		= classifier.classify(getFeatures(tweet_text.split()))

		tweet_data = { 
			'tweet_text' 					: tweet_text, 
			'tweet_age' 					: tweet_birth_ts,
			'tweet_sentiment_str' : tweet_sentiment, 
			'tweet_sentiment_int' : possible_values[tweet_sentiment], 
			'tweet_popularity'		: tweet_popularity,
			'user_followers' 		  : user_followers, 
			'retweet' 						: retweet,
			'tweet_hashtags' 			: tweet_hashtags_list, 
			'tweet_id'						: tweet_id
		}

		print json.dumps(tweet_data, ensure_ascii=True)
