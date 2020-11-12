const mongoose = require('mongoose');
const slugify = require('slugify');
const { default: validator } = require('validator');
const validate = require('validator');

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      require: [true, 'A tour must have a name'],
      unique: true,
      trim: true, // TRIM removes all the white spaces from the text. eg.-> "   This is a text full of space      "
      maxlength: [40, 'A tour name must have less or equal than 40 characters'],
      minlength: [10, 'A tour name must have more or equal than 10 characters']
      // validate: [validator.isAlpha, 'Tour name must only contain letters']
    },
    duration: {
      type: Number,
      require: [true, 'A tour must have a duration']
    },
    maxGroupSize: {
      type: Number,
      require: [true, 'A tour must have a group size']
    },
    difficulty: {
      type: String,
      require: [true, 'A tour must have a difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty is either: easy, medium or difficult'
      }
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0']
    },
    ratingsQuantity: {
      type: Number,
      default: 0
    },
    price: {
      type: Number,
      require: true
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function(val) {
          //  this only points to the current doc on new document creation
          return val < this.price;
        },
        message: 'Discount price ({VALUE}) should be below the actual price'
      }
    },
    summary: {
      type: String,
      trim: true, // TRIM removes all the white spaces from the text. eg.-> "   This is a text full of space      "
      require: [true, 'A tour must have a description']
    },
    description: {
      type: String,
      trim: true
    },
    imageCover: {
      type: String,
      require: [true, 'A tour must have a cover image']
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false
    }
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

tourSchema.virtual('durationWeeks').get(function() {
  // durationWeeks is part of the business logic
  return this.duration / 7;
});

// DOCUMENT MIDDLEWARE: runs before the .save() command and .create() command
tourSchema.pre('save', function() {
  this.slug = slugify(this.name, { lower: true });
  next();
});

// tourSchema.pre('save', function(next) {
//   console.log('saving document!');
// });

// tourSchema.post('save', function(doc, next) {
//   console.log(doc);
//   next();
// });

// QUERY MIDDLEWARE - Executes whenever a find method is called

// /^find/ consists of all queries startinf with the word find
tourSchema.pre(/^find/, function(next) {
  this.find({ secretTour: { $ne: true } });
  this.start = Date.now();
  next();
});

tourSchema.post(/^find/, function(docs, next) {
  console.log(`Query took ${Date.now() - this.start} milliseconds`);
  console.log(docs);
  next();
});

// AGGREGATION MIDDLEWARE
tourSchema.pre('aggregate', function(next) {
  this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
  console.log(this.pipeline());
  next();
});

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;