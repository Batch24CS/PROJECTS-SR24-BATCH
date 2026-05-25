/** Single latest location row per student (avoids duplicate student rows in JOINs). */
export const LATEST_LOCATION_JOIN = `
  LEFT JOIN location_updates latest ON latest.id = (
    SELECT lu2.id
    FROM location_updates lu2
    WHERE lu2.student_id = u.id
    ORDER BY lu2.last_updated DESC, lu2.id DESC
    LIMIT 1
  )
`;
