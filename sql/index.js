const sql = {};

sql.query = {
  // register
  add_user:
    "INSERT INTO users (username, password, first_name, last_name) VALUES ($1,$2,$3,$4)",
  add_petowner: "INSERT INTO petowners (username) VALUES ($1)",
  add_caretaker: "INSERT INTO caretakers (username) VALUES ($1)",
  add_fulltime_caretaker: "INSERT INTO fulltime (username) VALUES ($1)",
  add_parttime_caretaker: "INSERT INTO parttime (username) VALUES ($1)",
  add_admin: "INSERT INTO admin (username) VALUES ($1)",
  // login
  get_user: "SELECT * FROM users WHERE username=$1",

  // pets
  get_pets: "SELECT * FROM pets WHERE username=$1",
  add_pet:
    "INSERT INTO pets (username, name, animal_type, special_requirement) VALUES ($1,$2,$3,$4)",

  // petowners
  get_petowner: "SELECT * FROM petowners WHERE username=$1",

  // caretakers
  get_caretaker: "SELECT * FROM caretakers WHERE username=$1",
  get_browsed_caretaker:
    "SELECT * FROM caretakers NATURAL JOIN users WHERE username=$1",

  browse:
    "SELECT * FROM (SELECT t.username, min(t.avail_date) as s_date, max(t.avail_date) as e_date FROM (SELECT b.avail_date, b.username, b.avail_date + (interval '1 day' * -row_number() over (PARTITION BY b.username ORDER BY b.avail_date)) as i FROM (SELECT * FROM availability NATURAL JOIN caretakers) b) t GROUP BY t.username, i ORDER BY t.username, s_date) av NATURAL JOIN users",

  // insert pet
  insert_pet: "INSERT INTO pets VALUES ($1, $2, $3, $4)",

  // admin
  get_admin: "SELECT * FROM admin WHERE username=$1",

  // bids
  get_review:
    "SELECT first_name, last_name, review, rating FROM bids JOIN users ON users.username = bids.pouname WHERE ctuname=$1 AND (review IS NOT NULL OR rating IS NOT NULL)",
  add_review:
    "UPDATE bids SET rating=$6, review=$7 WHERE bids.pouname=$1 AND bids.ctuname=$2 AND bids.name=$3 AND bids.s_date=$4 AND bids.e_date=$5",
  get_successful_bid:
    "SELECT * FROM bids JOIN users ON bids.ctuname = users.username WHERE pouname=$1 AND is_win = TRUE",
  add_bid_date:
    "INSERT INTO bid_dates (s_date, e_date) VALUES ($1,$2) ON CONFLICT DO NOTHING",
  add_bid:
    "INSERT INTO bids (pouname, ctuname, name, s_date, e_date, price) VALUES ($1,$2,$3,$4,$5,$6)",
  get_bid:
    "SELECT * FROM bids NATURAL JOIN pets NATURAL JOIN petowners JOIN users ON bids.pouname = users.username WHERE ctuname=$1 AND is_win = FALSE",
  
  caretaker_get_max:
    "SELECT * FROM get_max_by($1) AS g JOIN bids ON bids.ctuname = g.ctuname JOIN users ON users.username = bids.pouname WHERE g.ctuname=$2 AND g.max_amount = bids.price",

  update_bid:
    "UPDATE bids SET is_win = TRUE WHERE bids.pouname=$1 AND bids.ctuname=$2 AND bids.name=$3 AND bids.s_date=$4 AND bids.e_date=$5 AND bids.price=$6",
  // update_bid:
  //   "INSERT INTO bids (pouname, ctuname, name, s_date, e_date, price) VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT(pouname, ctuname, name, s_date, e_date) DO UPDATE SET is_win = TRUE WHERE bids.pouname=$1 AND bids.ctuname=$2 AND bids.name=$3 AND bids.s_date=$4 AND bids.e_date=$5",

  // admin queries
  get_num_of_pets_within_month:
    "SELECT COUNT(DISTINCT name) FROM bids WHERE is_win = TRUE AND (s_date >= '2021-05-01' AND s_date <= '2021-05-31') OR (e_date >= '2021-05-01' AND e_date <= '2021-05-31')",

  get_atype_stats:
    "SELECT a_type, COALESCE(pets, 0) AS pets, COALESCE(petowners, 0) AS petowners, COALESCE(caretakers,0) AS caretakers FROM (SELECT a_type, COUNT(*) AS pets FROM pets GROUP BY a_type) AS pets NATURAL LEFT JOIN(SELECT a_type, COUNT(DISTINCT(username)) AS petowners FROM pets GROUP BY a_type) AS petowners NATURAL LEFT JOIN (SELECT a_type, COUNT(DISTINCT(ctuname)) AS caretakers FROM cares_for GROUP BY a_type) AS caretakers",

  get_num_of_caretakers: "SELECT COUNT(*) FROM caretakers",

  get_num_of_petowners: "SELECT COUNT(*) FROM petowners",

  get_num_of_fulltime: "SELECT COUNT(*) FROM fulltime",

  get_num_of_parttime: "SELECT COUNT(*) FROM parttime",

  get_num_of_pets: "SELECT COUNT(*) FROM pets",

  get_num_of_pet_days:
    "SELECT COALESCE(SUM(e_date - s_date + 1), 0) AS num_days FROM bids WHERE is_win = True AND ctuname = $1 AND ((s_date >= (SELECT date_trunc('month', CURRENT_DATE))AND s_date <= (SELECT date_trunc('month', CURRENT_DATE) + interval '1 month - 1 day')) OR (e_date >= (SELECT date_trunc('month', CURRENT_DATE)) AND e_date <= (SELECT date_trunc('month', CURRENT_DATE) + interval '1 month - 1 day')))",

  get_indiv_fulltime_salary:
    "WITH pet_days AS (SELECT COALESCE(SUM(e_date - s_date + 1), 0) AS num_days FROM bids WHERE is_win = True AND ctuname = $1 AND ((s_date >= (SELECT date_trunc('month', CURRENT_DATE)) AND s_date <= (SELECT date_trunc('month', CURRENT_DATE) + interval '1 month - 1 day')) OR (e_date >= (SELECT date_trunc('month', CURRENT_DATE)) AND e_date <= (SELECT date_trunc('month', CURRENT_DATE) + interval '1 month - 1 day')))) SELECT CASE WHEN (SELECT num_days FROM pet_days) <= 60 THEN 3000 ELSE 3000 +  (SELECT ((SELECT num_days FROM pet_days) - 60)* MAX(price)*0.8 FROM bids WHERE  is_win = True AND ctuname = $1 AND ((s_date >= (SELECT date_trunc('month', CURRENT_DATE))AND s_date <= (SELECT date_trunc('month', CURRENT_DATE) + interval '1 month - 1 day')) OR (e_date >= (SELECT date_trunc('month', CURRENT_DATE)) AND e_date <= (SELECT date_trunc('month', CURRENT_DATE) + interval '1 month - 1 day')))) END AS salary",

 
  get_total_earnings:
  "SELECT SUM(salary) FROM caretakers",

  get_parttime_caretakers_total_salary:
  "SELECT SUM(salary) FROM caretakers c WHERE c.username IN (SELECT username FROM parttime)",

  get_fulltime_caretakers_total_salary:
  "SELECT SUM(salary) FROM caretakers c WHERE c.username IN (SELECT username FROM fulltime)",

  get_parttime_caretaker_with_max_salary:
  "SELECT username, salary FROM caretakers WHERE salary = (SELECT MAX(salary) FROM caretakers WHERE caretakers.username IN (SELECT username FROM parttime)) AND caretakers.username IN (SELECT username FROM parttime) LIMIT 1",
  
  get_fulltime_caretaker_with_max_salary:
  "SELECT username, salary FROM caretakers WHERE salary = (SELECT MAX(salary) FROM caretakers WHERE caretakers.username IN (SELECT username FROM fulltime)) AND caretakers.username IN (SELECT username FROM fulltime) LIMIT 1",

  get_caretaker_history:
    "SELECT * FROM bids WHERE ctuname=$1 AND is_win = TRUE",

  get_petowner_history:
    "SELECT *, CASE WHEN is_win=TRUE then 'ACCEPTED' WHEN is_win=FALSE AND s_date > now() THEN 'PENDING' ELSE 'REJECTED' END AS status FROM bids WHERE pouname = $1",

  apply_for_leave:
    "INSERT INTO takes_leave (ctuname, s_date, e_date) SELECT $1, $2, $3 WHERE NOT EXISTS (SELECT 1 FROM bids WHERE bids.ctuname=CAST($1 AS varchar) AND bids.is_win=TRUE AND bids.s_date<=$2 AND bids.e_date>=$3);",
 
  add_availability:
    "INSERT INTO availability VALUES ($1, $2, 0)",
  
  check_fulltime:
    "SELECT CASE WHEN EXISTS (SELECT 1 FROM fulltime WHERE username = $1) THEN CAST(1 AS BOOL) ELSE CAST(0 AS BOOL) END AS IS_FULLTIME;",

  get_availability: "SELECT * FROM  availability WHERE username=$1;",

  get_rating:"SELECT AVG(rating) FROM bids WHERE is_win = true AND ctuname=$1;",


  

};

module.exports = sql;
