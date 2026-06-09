import styles from './Skeleton.module.css'

export function SkeletonLine({ width = '100%', height = '1rem' }) {
  return (
    <div
      className={`skeleton ${styles.line}`}
      style={{ width, height }}
    />
  )
}

export function SkeletonCard() {
  return (
    <div className={styles.card}>
      <div className={styles.cardTop}>
        <div className={`skeleton ${styles.badge}`} />
        <div className={`skeleton ${styles.date}`} />
      </div>
      <div className={styles.cardBody}>
        <SkeletonLine width="60%" height="1.1rem" />
        <SkeletonLine width="90%" height="0.85rem" />
        <SkeletonLine width="45%" height="0.85rem" />
      </div>
      <div className={styles.cardFooter}>
        <div className={`skeleton ${styles.btn}`} />
        <div className={`skeleton ${styles.btn}`} />
        <div className={`skeleton ${styles.btn}`} />
      </div>
    </div>
  )
}

export function SkeletonTable({ rows = 5 }) {
  return (
    <div className={styles.table}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className={styles.tableRow}>
          <SkeletonLine width="25%" height="0.9rem" />
          <SkeletonLine width="15%" height="0.9rem" />
          <SkeletonLine width="12%" height="0.9rem" />
          <SkeletonLine width="18%" height="0.9rem" />
          <SkeletonLine width="10%" height="0.9rem" />
        </div>
      ))}
    </div>
  )
}
