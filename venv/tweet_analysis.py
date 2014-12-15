import nltk
import sys
import json
import tweets_training
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

#for t in corpusOfTweet:
	#print(t)

word_features = wordFeatures(bagOfWords(corpusOfTweet))

training = nltk.classify.apply_features(getFeatures, corpusOfTweet)
classifier = nltk.NaiveBayesClassifier.train(training)

#print(classifier.show_most_informative_features(15))

# print string passed form node
# 2. PROCESS STREMING DATA
#for line in sys.stdin:
#	print 'TWEET BODY: ' + line[:]
#	print 'SENTIMENT ' + classifier.classify(getFeatures(line[:-1].split()))

# 1. PROCESS SEARCH DATA
for tweet in sys.stdin:
	a =  json.loads(tweet)
	for i, j in enumerate(a):
		tweet_text = a[i]['text']
		tweet_age = a[i]['created_at']
		tweet_sentiment = classifier.classify(getFeatures(tweet_text.split()))
		tweet_popularity = a[i]['retweet_count']
		#user_geo = time_zone else 
		user_followers = a[i]['user']['followers_count']

		tweet_data = { 'tweet_text' : tweet_text, 
		'tweet_age' : tweet_age, 
		'tweet_sentiment' : tweet_sentiment, 
		'tweet_popularity' : tweet_popularity, 
		'user_followers' : user_followers }

		print json.dumps(tweet_data, ensure_ascii=True)
